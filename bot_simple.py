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

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("bot")

trades_today = 0
last_date = datetime.now().date()

SKIP = {"NEW", "BUY", "SELL", "THE", "AND", "FOR", "TRADE", "ALERT", "SMART", "MONEY", "LONG",
        "SHORT", "ENTRY", "STOP", "TARGET", "LOSS", "PROFIT", "TAKE", "EXIT", "CLOSE",
        "CLOSING", "SOLD", "BOUGHT", "OPTIONS", "OPTION", "CALL", "PUT", "STRIKE",
        "ADDED", "ADDING", "UPDATE", "POSITION", "ETF", "STOCK", "TIONS"}


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
    for w in re.findall(r'\b([A-Z]{1,5})\b', text):
        if w not in SKIP and len(w) >= 2:
            return w
    return None


def parse_alert(subject, body):
    text = (subject + " " + body).upper()
    is_option = any(w in text for w in ["CALL", "PUT", "OPTION", "STRIKE", "EXPIR"])
    alert = {
        "type": "option" if is_option else "stock",
        "timestamp": datetime.now().isoformat(),
        "subject": subject,
        "ticker": get_ticker(text),
        "direction": None,
        "entry": None,
        "stop": None,
        "target": None,
        "option_type": None,
        "strike": None,
        "expiry": None,
        "parsed": False
    }
    if any(w in text for w in ["BUY", "LONG", "BOUGHT", "BUYING", "ADDED"]):
        alert["direction"] = "BUY"
    elif any(w in text for w in ["SELL", "SHORT", "SOLD", "SELLING", "CLOSED", "EXIT"]):
        alert["direction"] = "SELL"
    if is_option:
        if "CALL" in text:
            alert["option_type"] = "CALL"
        elif "PUT" in text:
            alert["option_type"] = "PUT"
        m = re.search(r'(\d+\.?\d*)\s*(?:CALL|PUT|STRIKE)', text)
        if m:
            alert["strike"] = float(m.group(1))
        m = re.search(r'(\d{1,2}[/-]\d{1,2}[/-]?\d{0,4})', text)
        if m:
            alert["expiry"] = m.group(1)
    prices = re.findall(r'\$?(\d+\.\d{1,2})', text)
    if prices:
        alert["entry"] = float(prices[0])
        if len(prices) >= 2:
            alert["stop"] = float(prices[1])
        if len(prices) >= 3:
            alert["target"] = float(prices[2])
    m = re.search(r'(?:ENTRY|BOUGHT?\s*(?:AT)?|ENTER)\s*\$?(\d+\.\d{1,2})', text)
    if m:
        alert["entry"] = float(m.group(1))
    m = re.search(r'(?:STOP|STOP.?LOSS|SL)\s*\$?(\d+\.\d{1,2})', text)
    if m:
        alert["stop"] = float(m.group(1))
    m = re.search(r'(?:TARGET|TP|TAKE.?PROFIT|PT)\s*\$?(\d+\.\d{1,2})', text)
    if m:
        alert["target"] = float(m.group(1))
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
                  "size", "option_type", "strike", "expiry", "paper", "status"]
        w = csv.DictWriter(f, fieldnames=fields)
        if not exists:
            w.writeheader()
        row = {k: info.get(k, "") for k in fields}
        w.writerow(row)


def execute(alert):
    global trades_today
    size = position_size(alert["entry"], alert["type"])
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
        "status": "PAPER" if PAPER_TRADING else "PENDING"
    }
    log.info("[PAPER] %s %s x %s @ %s | SL:%s TP:%s",
             alert["direction"], size, alert["ticker"],
             alert["entry"], alert["stop"], alert["target"])
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
            if any(w in combined for w in ["ALERT", "TRADE", "BUY", "SELL", "ENTRY", "STOP",
                                           "TARGET", "CALL", "PUT", "OPTION"]):
                alert = parse_alert(subject, body)
                alerts.append(alert)
                log.info("Alert: %s", subject[:60])
            seen.add(mid_str)
        mail.logout()
    except Exception as e:
        log.error("Email error: %s", e)
    return alerts


def main():
    log.info("=" * 50)
    log.info("Trading Bot Started")
    log.info("Paper Trading: %s", PAPER_TRADING)
    log.info("Budget: EUR %.0f", EUR_BUDGET)
    log.info("Max trades/day: %d", MAX_TRADES)
    log.info("=" * 50)
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
