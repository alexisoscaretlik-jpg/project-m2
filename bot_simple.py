import imaplib, email, re, os, csv, json, time, logging
from datetime import datetime, timedelta
from email.header import decode_header

EMAIL_USERNAME = os.getenv("EMAIL_USERNAME", "")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "")
EMAIL_IMAP_SERVER = os.getenv("EMAIL_IMAP_SERVER", "imap.gmail.com")
EMAIL_CHECK_INTERVAL = int(os.getenv("EMAIL_CHECK_INTERVAL", "60"))
PAPER_TRADING = os.getenv("PAPER_TRADING", "true").lower() == "true"
EUR_BUDGET = float(os.getenv("EUR_BUDGET_PER_TRADE", "5000"))
MAX_TRADES = int(os.getenv("MAX_TRADES_PER_DAY", "100"))
EUR_USD = float(os.getenv("EUR_TO_USD_RATE", "1.08"))
LOG_FILE = os.getenv("LOG_FILE", "trades.csv")
BROKER = os.getenv("BROKER", "paper").lower()
IBKR_HOST = os.getenv("IBKR_HOST", "127.0.0.1")
IBKR_PORT = int(os.getenv("IBKR_PORT", "7497"))
IBKR_CLIENT_ID = int(os.getenv("IBKR_CLIENT_ID", "7"))

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("bot")

trades_today = 0
last_date = datetime.now().date()

SKIP = {"NEW", "BUY", "SELL", "THE", "AND", "FOR", "TRADE", "ALERT", "SMART", "MONEY", "LONG",
        "SHORT", "ENTRY", "STOP", "TARGET", "LOSS", "PROFIT", "TAKE", "EXIT", "CLOSE",
        "CLOSING", "SOLD", "BOUGHT", "OPTIONS", "OPTION", "CALL", "PUT", "STRIKE",
        "ADDED", "ADDING", "ADD", "UPDATE", "POSITION", "ETF", "STOCK", "TIONS",
        "TO", "AT", "ON", "IN", "IS", "IT", "OF", "OR", "AS", "BE", "AN", "A", "I",
        "DAILY", "WEEKLY", "MONTHLY", "HTTPS", "HTTP", "WWW", "COM", "NET", "ORG",
        "AM", "PM", "EST", "PST", "EDT", "PDT", "CT", "MT", "ET", "UTC",
        "USD", "EUR", "GBP", "US", "EU", "UK", "INC", "LLC", "CO", "LTD",
        "RE", "FW", "FWD", "IMPORTANT", "URGENT", "ALL", "ANY", "PER", "NOW", "YOUR"}


def reset_counter():
    global trades_today, last_date
    today = datetime.now().date()
    if today != last_date:
        trades_today = 0
        last_date = today


def get_ticker(text):
    m = re.search(r'\$([A-Z]{1,5})\b', text)
    if m and m.group(1) not in SKIP:
        return m.group(1)
    return None


def parse_alert(subject, body):
    text = subject + " " + body
    upper = text.upper()
    is_option = any(w in upper for w in ["CALL", "PUT", "OPTION", "STRIKE", "EXPIR"])
    alert = {
        "type": "option" if is_option else "stock",
        "timestamp": datetime.now().isoformat(),
        "subject": subject,
        "ticker": None,
        "direction": None,
        "entry": None,
        "stop": None,
        "target": None,
        "option_type": None,
        "strike": None,
        "expiry": None,
        "shares": None,
        "parsed": False,
    }

    m = re.search(
        r'\b(?:ADD|TRIM|OPEN|CLOSE|CLOSING)\s*\(\s*(LONG|SHORT|BUY|SELL)\s*\)\s*:\s*([A-Z]{1,5})\b',
        upper,
    )
    if m and m.group(2) not in SKIP:
        alert["ticker"] = m.group(2)
        action = m.group(1)
        alert["direction"] = "BUY" if action in ("LONG", "BUY") else "SELL"

    if not alert["ticker"]:
        m = re.search(
            r'\b(LONG|SHORT|BUY|SELL|CLOSE|CLOSING)'
            r'(?:\s+(?:TO\s+)?(?:OPEN|CLOSE|CLOSING))?'
            r'\s*[:\-]\s*([A-Z]{1,5})\b',
            upper,
        )
        if m and m.group(2) not in SKIP:
            alert["ticker"] = m.group(2)
            action = m.group(1)
            if action in ("LONG", "BUY"):
                alert["direction"] = "BUY"
            elif action in ("SHORT", "SELL"):
                alert["direction"] = "SELL"
            else:
                alert["direction"] = "CLOSE"

    if not alert["ticker"]:
        m = re.search(r'\$([A-Z]{1,5})\b', text)
        if m and m.group(1) not in SKIP:
            alert["ticker"] = m.group(1)

    if not alert["direction"]:
        m = re.search(r'\bSIDE\s*[:=]\s*(LONG|SHORT|BUY|SELL)\b', upper)
        if m:
            alert["direction"] = "BUY" if m.group(1) in ("LONG", "BUY") else "SELL"

    if not alert["direction"]:
        if re.search(r'\b(BUY|LONG|BOUGHT|BUYING|ADDED)\b', upper):
            alert["direction"] = "BUY"
        elif re.search(r'\b(SELL|SHORT|SOLD|SELLING|CLOSED|EXIT)\b', upper):
            alert["direction"] = "SELL"

    if is_option:
        if "CALL" in upper:
            alert["option_type"] = "CALL"
        elif "PUT" in upper:
            alert["option_type"] = "PUT"
        m = re.search(r'(\d+\.?\d*)\s*(?:CALL|PUT|STRIKE)', upper)
        if m:
            alert["strike"] = float(m.group(1))
        m = re.search(r'(\d{1,2}[/-]\d{1,2}[/-]?\d{0,4})', upper)
        if m:
            alert["expiry"] = m.group(1)

    m = re.search(r'\b(?:PRICE|ENTRY|BOUGHT\s*AT|BUY\s*AT|ENTER(?:\s*AT)?)\s*[:=@]?\s*\$?(\d+(?:\.\d{1,2})?)', upper)
    if m:
        alert["entry"] = float(m.group(1))
    m = re.search(r'\b(?:STOP[\s\-]?LOSS|STOP|SL)\b\s*[:=@]?\s*\$?(\d+(?:\.\d{1,2})?)', upper)
    if m:
        alert["stop"] = float(m.group(1))
    m = re.search(r'\b(?:TARGET|TAKE[\s\-]?PROFIT|TP|PT)\b\s*[:=@]?\s*\$?(\d+(?:\.\d{1,2})?)', upper)
    if m:
        alert["target"] = float(m.group(1))
    m = re.search(r'\bSHARES?\s*[:=]?\s*(\d+)', upper)
    if m:
        alert["shares"] = int(m.group(1))

    if alert["ticker"] and alert["direction"] and alert["entry"]:
        alert["parsed"] = True
    return alert


def position_size(price, atype):
    budget = EUR_BUDGET * EUR_USD
    if atype == "option":
        return max(1, int(budget / (price * 100)))
    return max(1, int(budget / price))


def safety_check(alert):
    issues = []
    if trades_today >= MAX_TRADES:
        issues.append("Max trades reached")
    if not alert["parsed"]:
        issues.append("Could not parse")
    if alert["entry"] and alert["stop"] and alert["target"]:
        risk = abs(alert["entry"] - alert["stop"])
        reward = abs(alert["target"] - alert["entry"])
        if risk > 0 and reward / risk < 1.0:
            issues.append("Bad risk/reward")
    return issues


def log_trade(info):
    exists = os.path.exists(LOG_FILE)
    with open(LOG_FILE, "a", newline="") as f:
        fields = ["timestamp", "ticker", "direction", "type", "entry", "stop", "target",
                  "size", "option_type", "strike", "expiry", "paper", "status", "order_id"]
        w = csv.DictWriter(f, fieldnames=fields)
        if not exists:
            w.writeheader()
        row = {k: info.get(k, "") for k in fields}
        w.writerow(row)


_ib = None


def get_ib():
    global _ib
    if BROKER != "ibkr":
        return None
    try:
        from ib_insync import IB
    except ImportError:
        log.error("ib_insync not installed; add it to requirements.txt")
        return None
    if _ib is not None and _ib.isConnected():
        return _ib
    _ib = IB()
    try:
        _ib.connect(IBKR_HOST, IBKR_PORT, clientId=IBKR_CLIENT_ID, timeout=10)
        log.info("Connected to IBKR %s:%s clientId=%s", IBKR_HOST, IBKR_PORT, IBKR_CLIENT_ID)
    except Exception as e:
        log.error("IBKR connect failed: %s", e)
        _ib = None
    return _ib


def place_ibkr_order(ticker, direction, size, stop, target):
    from ib_insync import Stock, MarketOrder, LimitOrder, StopOrder
    ib = get_ib()
    if ib is None:
        return None, "IBKR_DISCONNECTED"
    try:
        contract = Stock(ticker, "SMART", "USD")
        ib.qualifyContracts(contract)
        action = "BUY" if direction == "BUY" else "SELL"
        close_action = "SELL" if action == "BUY" else "BUY"
        parent = MarketOrder(action, size)
        parent.transmit = not (stop or target)
        parent_trade = ib.placeOrder(contract, parent)
        parent_id = parent_trade.order.orderId
        if target:
            tp = LimitOrder(close_action, size, target)
            tp.parentId = parent_id
            tp.transmit = not stop
            ib.placeOrder(contract, tp)
        if stop:
            sl = StopOrder(close_action, size, stop)
            sl.parentId = parent_id
            sl.transmit = True
            ib.placeOrder(contract, sl)
        ib.sleep(1)
        status = parent_trade.orderStatus.status or "SUBMITTED"
        return parent_trade.order.orderId, status
    except Exception as e:
        log.error("IBKR order failed for %s: %s", ticker, e)
        return None, "IBKR_ERROR"


def execute(alert):
    global trades_today
    size = alert.get("shares") or position_size(alert["entry"], alert["type"])
    order_id = None
    if BROKER == "ibkr" and alert["type"] == "stock":
        order_id, status = place_ibkr_order(
            alert["ticker"], alert["direction"], size,
            alert["stop"], alert["target"],
        )
        prefix = "[IBKR]"
    elif BROKER == "ibkr":
        status = "IBKR_SKIPPED_OPTION"
        prefix = "[IBKR]"
        log.warning("IBKR option orders not implemented; skipping %s", alert["ticker"])
    else:
        status = "PAPER" if PAPER_TRADING else "PENDING"
        prefix = "[PAPER]" if PAPER_TRADING else "[LIVE]"
    info = {
        "timestamp": datetime.now().isoformat(),
        "ticker": alert["ticker"],
        "direction": alert["direction"],
        "type": alert["type"],
        "entry": alert["entry"],
        "stop": alert["stop"],
        "target": alert["target"],
        "size": size,
        "option_type": alert.get("option_type"),
        "strike": alert.get("strike"),
        "expiry": alert.get("expiry"),
        "paper": PAPER_TRADING,
        "status": status,
        "order_id": order_id,
    }
    log.info("%s %s %s x %s @ %s | SL:%s TP:%s | status=%s order=%s",
             prefix, alert["direction"], size, alert["ticker"],
             alert["entry"], alert["stop"], alert["target"], status, order_id)
    trades_today += 1
    log_trade(info)
    return info


seen = set()


def check_email():
    alerts = []
    if not EMAIL_USERNAME or not EMAIL_PASSWORD:
        log.error("No email credentials set")
        return alerts
    try:
        mail = imaplib.IMAP4_SSL(EMAIL_IMAP_SERVER)
        mail.login(EMAIL_USERNAME, EMAIL_PASSWORD)
        mail.select("inbox")
        date_str = (datetime.now() - timedelta(days=1)).strftime("%d-%b-%Y")
        status, msgs = mail.search(None, '(SINCE "%s" FROM "verifiedinvesting")' % date_str)
        if status != "OK":
            return alerts
        for mid in msgs[0].split():
            mid_str = mid.decode()
            if mid_str in seen:
                continue
            status, data = mail.fetch(mid, "(RFC822)")
            if status != "OK":
                continue
            msg = email.message_from_bytes(data[0][1])
            subject = ""
            for part, enc in decode_header(msg["Subject"] or ""):
                if isinstance(part, bytes):
                    subject += part.decode(enc or "utf-8")
                else:
                    subject += str(part)
            body = ""
            if msg.is_multipart():
                for part in msg.walk():
                    if part.get_content_type() == "text/plain":
                        body = part.get_payload(decode=True).decode("utf-8", errors="ignore")
                        break
            else:
                body = msg.get_payload(decode=True).decode("utf-8", errors="ignore")
            combined = (subject + body).upper()
            if any(w in combined for w in ["ALERT", "TRADE", "BUY", "SELL", "LONG", "SHORT",
                                           "OPEN", "CLOSE", "ENTRY", "STOP", "TARGET",
                                           "PRICE", "SHARES", "CALL", "PUT", "OPTION"]):
                alert = parse_alert(subject, body)
                alerts.append(alert)
                log.info("Alert: %s", subject[:80])
                if not alert["parsed"]:
                    log.info("Unparsed alert. ticker=%s direction=%s entry=%s | body: %s",
                             alert["ticker"], alert["direction"], alert["entry"],
                             body[:300].replace("\n", " "))
            seen.add(mid_str)
        mail.logout()
    except Exception as e:
        log.error("Email error: %s", e)
    return alerts


def main():
    log.info("=" * 50)
    log.info("Trading Bot Started")
    log.info("Broker: %s", BROKER)
    if BROKER == "ibkr":
        log.info("IBKR: %s:%s clientId=%s", IBKR_HOST, IBKR_PORT, IBKR_CLIENT_ID)
    log.info("Paper Trading: %s", PAPER_TRADING)
    log.info("Budget: EUR %.0f", EUR_BUDGET)
    log.info("Max trades/day: %d", MAX_TRADES)
    log.info("=" * 50)
    if BROKER == "ibkr":
        get_ib()
    while True:
        try:
            reset_counter()
            for alert in check_email():
                issues = safety_check(alert)
                if issues:
                    log.warning("Skipped %s: %s", alert.get("ticker"), issues)
                    continue
                execute(alert)
            time.sleep(EMAIL_CHECK_INTERVAL)
        except KeyboardInterrupt:
            log.info("Stopped")
            break
        except Exception as e:
            log.error("Error: %s", e)
            time.sleep(EMAIL_CHECK_INTERVAL)


main()
