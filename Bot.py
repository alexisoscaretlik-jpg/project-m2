#!/usr/bin/env python3
“””
Verified Investing ? Interactive Brokers Automated Trading Bot
Monitors email for Gareth Soloway alerts and places bracket orders on IBKR.
“””

import imaplib
import email
import re
import os
import csv
import json
import time
import logging
from datetime import datetime, timedelta
from email.header import decode_header

# ??? Configuration ???????????????????????????????????????????????

EMAIL_USERNAME = os.getenv(“EMAIL_USERNAME”, “”)
EMAIL_PASSWORD = os.getenv(“EMAIL_PASSWORD”, “”)
EMAIL_IMAP_SERVER = os.getenv(“EMAIL_IMAP_SERVER”, “imap.gmail.com”)
EMAIL_CHECK_INTERVAL = int(os.getenv(“EMAIL_CHECK_INTERVAL”, “60”))  # seconds

PAPER_TRADING = os.getenv(“PAPER_TRADING”, “true”).lower() == “true”
EUR_BUDGET_PER_TRADE = float(os.getenv(“EUR_BUDGET_PER_TRADE”, “5000”))
MAX_TRADES_PER_DAY = int(os.getenv(“MAX_TRADES_PER_DAY”, “100”))
EUR_TO_USD_RATE = float(os.getenv(“EUR_TO_USD_RATE”, “1.08”))

IBKR_HOST = os.getenv(“IBKR_HOST”, “127.0.0.1”)
IBKR_PORT = int(os.getenv(“IBKR_PORT”, “7497”))  # 7497=paper, 7496=live
IBKR_CLIENT_ID = int(os.getenv(“IBKR_CLIENT_ID”, “1”))

LOG_FILE = os.getenv(“LOG_FILE”, “trades.csv”)
ALERT_LOG_FILE = os.getenv(“ALERT_LOG_FILE”, “alerts.json”)

# ??? Logging ?????????????????????????????????????????????????????

logging.basicConfig(
level=logging.INFO,
format=”%(asctime)s [%(levelname)s] %(message)s”,
handlers=[
logging.StreamHandler(),
logging.FileHandler(“bot.log”)
]
)
log = logging.getLogger(“trading-bot”)

# ??? Trade Counter ???????????????????????????????????????????????

trades_today = 0
last_trade_date = datetime.now().date()

def reset_daily_counter():
global trades_today, last_trade_date
today = datetime.now().date()
if today != last_trade_date:
trades_today = 0
last_trade_date = today

# ??? Alert Parser ????????????????????????????????????????????????

class AlertParser:
“”“Parses Verified Investing email alerts from Gareth Soloway.”””

```
@staticmethod
def parse_stock_alert(subject, body):
    """Parse Smart Money: Stocks & ETFs alerts."""
    alert = {
        "type": "stock",
        "timestamp": datetime.now().isoformat(),
        "raw_subject": subject,
        "ticker": None,
        "direction": None,
        "entry_price": None,
        "stop_loss": None,
        "target_price": None,
        "parsed": False
    }

    text = f"{subject} {body}".upper()

    # Common words to skip when looking for tickers
    skip_words = {
        "NEW", "BUY", "SELL", "THE", "AND", "FOR", "TRADE", "ALERT",
        "SMART", "MONEY", "LONG", "SHORT", "ENTRY", "STOP", "TARGET",
        "LOSS", "PROFIT", "TAKE", "EXIT", "CLOSE", "CLOSING", "SOLD",
        "BOUGHT", "OPTIONS", "OPTION", "CALL", "PUT", "STRIKE",
        "ADDED", "ADDING", "UPDATE", "POSITION", "ETF", "STOCK"
    }

    # Extract ticker - prefer $TICKER format first
    dollar_match = re.search(r'\$([A-Z]{1,5})\b', text)
    if dollar_match and dollar_match.group(1) not in skip_words:
        alert["ticker"] = dollar_match.group(1)
    else:
        # Find first uppercase word that looks like a ticker
        words = re.findall(r'\b([A-Z]{1,5})\b', text)
        for w in words:
            if w not in skip_words and len(w) >= 2:
                alert["ticker"] = w
                break

    # Detect direction
    if any(word in text for word in ["BUY", "LONG", "BOUGHT", "BUYING", "ADDED"]):
        alert["direction"] = "BUY"
    elif any(word in text for word in ["SELL", "SHORT", "SOLD", "SELLING", "CLOSED", "EXIT"]):
        alert["direction"] = "SELL"

    # Extract prices
    prices = re.findall(r'\$?([\d]+\.[\d]{1,2})', text)
    if len(prices) >= 1:
        alert["entry_price"] = float(prices[0])
    if len(prices) >= 2:
        alert["stop_loss"] = float(prices[1])
    if len(prices) >= 3:
        alert["target_price"] = float(prices[2])

    # Try specific patterns
    entry_match = re.search(r'(?:ENTRY|BOUGHT?\s*(?:AT)?|ENTER)\s*\$?([\d]+\.[\d]{1,2})', text)
    if entry_match:
        alert["entry_price"] = float(entry_match.group(1))

    stop_match = re.search(r'(?:STOP|STOP.?LOSS|SL)\s*\$?([\d]+\.[\d]{1,2})', text)
    if stop_match:
        alert["stop_loss"] = float(stop_match.group(1))

    target_match = re.search(r'(?:TARGET|TP|TAKE.?PROFIT|PT)\s*\$?([\d]+\.[\d]{1,2})', text)
    if target_match:
        alert["target_price"] = float(target_match.group(1))

    if alert["ticker"] and alert["direction"] and alert["entry_price"]:
        alert["parsed"] = True

    return alert

@staticmethod
def parse_options_alert(subject, body):
    """Parse Smart Money: Options alerts."""
    alert = {
        "type": "option",
        "timestamp": datetime.now().isoformat(),
        "raw_subject": subject,
        "ticker": None,
        "direction": None,
        "option_type": None,  # CALL or PUT
        "strike": None,
        "expiration": None,
        "entry_price": None,
        "stop_loss": None,
        "target_price": None,
        "parsed": False
    }

    text = f"{subject} {body}".upper()

    skip_words = {
        "NEW", "BUY", "SELL", "THE", "AND", "FOR", "TRADE", "ALERT",
        "SMART", "MONEY", "LONG", "SHORT", "ENTRY", "STOP", "TARGET",
        "LOSS", "PROFIT", "TAKE", "EXIT", "CLOSE", "CLOSING", "SOLD",
        "BOUGHT", "OPTIONS", "OPTION", "CALL", "PUT", "STRIKE",
        "ADDED", "ADDING", "UPDATE", "POSITION", "ETF", "STOCK", "TIONS"
    }

    # Extract ticker - prefer $TICKER format
    dollar_match = re.search(r'\$([A-Z]{1,5})\b', text)
    if dollar_match and dollar_match.group(1) not in skip_words:
        alert["ticker"] = dollar_match.group(1)
    else:
        words = re.findall(r'\b([A-Z]{1,5})\b', text)
        for w in words:
            if w not in skip_words and len(w) >= 2:
                alert["ticker"] = w
                break

    # Detect direction
    if any(word in text for word in ["BUY", "BOUGHT", "LONG"]):
        alert["direction"] = "BUY"
    elif any(word in text for word in ["SELL", "SOLD", "CLOSE"]):
        alert["direction"] = "SELL"

    # Option type
    if "CALL" in text:
        alert["option_type"] = "CALL"
    elif "PUT" in text:
        alert["option_type"] = "PUT"

    # Strike price
    strike_match = re.search(r'(\d+\.?\d*)\s*(?:CALL|PUT|STRIKE|C\b|P\b)', text)
    if strike_match:
        alert["strike"] = float(strike_match.group(1))

    # Expiration
    exp_match = re.search(r'(\d{1,2}[/\-]\d{1,2}[/\-]?\d{0,4})', text)
    if exp_match:
        alert["expiration"] = exp_match.group(1)

    # Prices
    prices = re.findall(r'\$?([\d]+\.[\d]{1,2})', text)
    if len(prices) >= 1:
        alert["entry_price"] = float(prices[0])

    entry_match = re.search(r'(?:ENTRY|BOUGHT?\s*(?:AT)?|ENTER)\s*\$?([\d]+\.[\d]{1,2})', text)
    if entry_match:
        alert["entry_price"] = float(entry_match.group(1))

    stop_match = re.search(r'(?:STOP|SL)\s*\$?([\d]+\.[\d]{1,2})', text)
    if stop_match:
        alert["stop_loss"] = float(stop_match.group(1))

    target_match = re.search(r'(?:TARGET|TP|PT)\s*\$?([\d]+\.[\d]{1,2})', text)
    if target_match:
        alert["target_price"] = float(target_match.group(1))

    if alert["ticker"] and alert["direction"] and alert["entry_price"]:
        alert["parsed"] = True

    return alert

@staticmethod
def classify_and_parse(subject, body):
    """Determine alert type and parse accordingly."""
    text = f"{subject} {body}".upper()
    if any(word in text for word in ["CALL", "PUT", "OPTION", "STRIKE", "EXPIR"]):
        return AlertParser.parse_options_alert(subject, body)
    return AlertParser.parse_stock_alert(subject, body)
```

# ??? Position Sizer ??????????????????????????????????????????????

def calculate_position_size(entry_price, alert_type=“stock”):
“”“Calculate number of shares/contracts based on EUR budget.”””
usd_budget = EUR_BUDGET_PER_TRADE * EUR_TO_USD_RATE
if alert_type == “option”:
# Options: price is per share, 1 contract = 100 shares
contracts = int(usd_budget / (entry_price * 100))
return max(contracts, 1)
else:
shares = int(usd_budget / entry_price)
return max(shares, 1)

# ??? Safety Checks ???????????????????????????????????????????????

def safety_check(alert):
“”“Run safety checks before placing an order.”””
issues = []

```
reset_daily_counter()
if trades_today >= MAX_TRADES_PER_DAY:
    issues.append(f"Max trades per day reached ({MAX_TRADES_PER_DAY})")

if not alert.get("parsed"):
    issues.append("Alert could not be fully parsed")

if alert.get("entry_price") and alert.get("stop_loss") and alert.get("target_price"):
    risk = abs(alert["entry_price"] - alert["stop_loss"])
    reward = abs(alert["target_price"] - alert["entry_price"])
    if risk > 0:
        rr_ratio = reward / risk
        if rr_ratio < 1.0:
            issues.append(f"Risk/reward ratio too low: 1:{rr_ratio:.1f}")

if alert.get("entry_price", 0) <= 0:
    issues.append("Invalid entry price")

return issues
```

# ??? IBKR Order Placer ???????????????????????????????????????????

class IBKRTrader:
“”“Places orders on Interactive Brokers via TWS API.”””

```
def __init__(self):
    self.connected = False
    self.ib = None

def connect(self):
    """Connect to IBKR TWS/Gateway."""
    try:
        from ib_insync import IB
        self.ib = IB()
        self.ib.connect(IBKR_HOST, IBKR_PORT, clientId=IBKR_CLIENT_ID)
        self.connected = True
        log.info(f"Connected to IBKR at {IBKR_HOST}:{IBKR_PORT}")
    except ImportError:
        log.warning("ib_insync not installed. Run: pip install ib_insync")
        self.connected = False
    except Exception as e:
        log.error(f"Failed to connect to IBKR: {e}")
        self.connected = False

def place_bracket_order(self, alert):
    """Place a bracket order (entry + stop + target)."""
    global trades_today

    size = calculate_position_size(
        alert["entry_price"],
        alert["type"]
    )

    order_info = {
        "timestamp": datetime.now().isoformat(),
        "ticker": alert["ticker"],
        "direction": alert["direction"],
        "type": alert["type"],
        "entry_price": alert["entry_price"],
        "stop_loss": alert.get("stop_loss"),
        "target_price": alert.get("target_price"),
        "size": size,
        "paper_trading": PAPER_TRADING,
        "status": "PENDING"
    }

    # Options specific info
    if alert["type"] == "option":
        order_info["option_type"] = alert.get("option_type")
        order_info["strike"] = alert.get("strike")
        order_info["expiration"] = alert.get("expiration")

    if PAPER_TRADING:
        order_info["status"] = "PAPER_EXECUTED"
        log.info(f"[PAPER] {alert['direction']} {size} x {alert['ticker']} "
                 f"@ ${alert['entry_price']} | SL: ${alert.get('stop_loss')} | "
                 f"TP: ${alert.get('target_price')}")
        trades_today += 1
        log_trade(order_info)
        return order_info

    if not self.connected:
        log.error("Not connected to IBKR. Order not placed.")
        order_info["status"] = "FAILED_NO_CONNECTION"
        log_trade(order_info)
        return order_info

    try:
        from ib_insync import Stock, LimitOrder, StopOrder

        if alert["type"] == "stock":
            contract = Stock(alert["ticker"], "SMART", "USD")
            self.ib.qualifyContracts(contract)

            action = "BUY" if alert["direction"] == "BUY" else "SELL"

            # Main entry order
            entry_order = LimitOrder(action, size, alert["entry_price"])

            # Place bracket
            bracket = self.ib.bracketOrder(
                action=action,
                quantity=size,
                limitPrice=alert["entry_price"],
                takeProfitPrice=alert.get("target_price", alert["entry_price"] * 1.1),
                stopLossPrice=alert.get("stop_loss", alert["entry_price"] * 0.95)
            )

            for o in bracket:
                self.ib.placeOrder(contract, o)

            order_info["status"] = "EXECUTED"
            log.info(f"[LIVE] {action} {size} x {alert['ticker']} "
                     f"@ ${alert['entry_price']}")

        trades_today += 1
        log_trade(order_info)
        return order_info

    except Exception as e:
        log.error(f"Order placement failed: {e}")
        order_info["status"] = f"FAILED: {str(e)}"
        log_trade(order_info)
        return order_info
```

# ??? Trade Logger ????????????????????????????????????????????????

def log_trade(order_info):
“”“Log trade to CSV file.”””
file_exists = os.path.exists(LOG_FILE)
with open(LOG_FILE, “a”, newline=””) as f:
writer = csv.DictWriter(f, fieldnames=[
“timestamp”, “ticker”, “direction”, “type”, “entry_price”,
“stop_loss”, “target_price”, “size”, “option_type”, “strike”,
“expiration”, “paper_trading”, “status”
])
if not file_exists:
writer.writeheader()
row = {k: order_info.get(k, “”) for k in writer.fieldnames}
writer.writerow(row)

def log_alert(alert):
“”“Log raw alert to JSON file.”””
alerts = []
if os.path.exists(ALERT_LOG_FILE):
with open(ALERT_LOG_FILE, “r”) as f:
try:
alerts = json.load(f)
except json.JSONDecodeError:
alerts = []
alerts.append(alert)
with open(ALERT_LOG_FILE, “w”) as f:
json.dump(alerts, f, indent=2)

# ??? Email Monitor ???????????????????????????????????????????????

class EmailMonitor:
“”“Monitors Gmail for Verified Investing alerts.”””

```
def __init__(self):
    self.seen_ids = set()
    self.load_seen_ids()

def load_seen_ids(self):
    """Load previously seen email IDs."""
    try:
        if os.path.exists("seen_emails.json"):
            with open("seen_emails.json", "r") as f:
                self.seen_ids = set(json.load(f))
    except Exception:
        self.seen_ids = set()

def save_seen_ids(self):
    """Save seen email IDs."""
    with open("seen_emails.json", "w") as f:
        json.dump(list(self.seen_ids), f)

def check_for_alerts(self):
    """Check email for new Verified Investing alerts."""
    alerts = []

    if not EMAIL_USERNAME or not EMAIL_PASSWORD:
        log.error("Email credentials not set. Set EMAIL_USERNAME and EMAIL_PASSWORD.")
        return alerts

    try:
        mail = imaplib.IMAP4_SSL(EMAIL_IMAP_SERVER)
        mail.login(EMAIL_USERNAME, EMAIL_PASSWORD)
        mail.select("inbox")

        # Search for Verified Investing emails from last 24 hours
        date_str = (datetime.now() - timedelta(days=1)).strftime("%d-%b-%Y")
        search_criteria = f'(SINCE "{date_str}" FROM "verifiedinvesting")'

        status, messages = mail.search(None, search_criteria)

        if status != "OK":
            log.warning("Email search returned no results")
            return alerts

        for msg_id in messages[0].split():
            msg_id_str = msg_id.decode()

            if msg_id_str in self.seen_ids:
                continue

            status, msg_data = mail.fetch(msg_id, "(RFC822)")
            if status != "OK":
                continue

            msg = email.message_from_bytes(msg_data[0][1])

            subject = ""
            subject_header = decode_header(msg["Subject"])
            for part, encoding in subject_header:
                if isinstance(part, bytes):
                    subject += part.decode(encoding or "utf-8")
                else:
                    subject += part

            body = ""
            if msg.is_multipart():
                for part in msg.walk():
                    if part.get_content_type() == "text/plain":
                        body = part.get_payload(decode=True).decode("utf-8", errors="ignore")
                        break
                    elif part.get_content_type() == "text/html":
                        body = part.get_payload(decode=True).decode("utf-8", errors="ignore")
            else:
                body = msg.get_payload(decode=True).decode("utf-8", errors="ignore")

            # Check if this is a trade alert
            combined = f"{subject} {body}".upper()
            is_alert = any(word in combined for word in [
                "ALERT", "TRADE", "BUY", "SELL", "ENTRY", "STOP",
                "TARGET", "LONG", "SHORT", "BOUGHT", "SOLD",
                "CALL", "PUT", "OPTION"
            ])

            if is_alert:
                alert = AlertParser.classify_and_parse(subject, body)
                alert["email_id"] = msg_id_str
                alert["email_subject"] = subject
                alerts.append(alert)
                log.info(f"New alert found: {subject[:80]}")

            self.seen_ids.add(msg_id_str)

        self.save_seen_ids()
        mail.logout()

    except imaplib.IMAP4.error as e:
        log.error(f"IMAP error: {e}")
    except Exception as e:
        log.error(f"Email check failed: {e}")

    return alerts
```

# ??? Main Loop ???????????????????????????????????????????????????

def main():
“”“Main bot loop.”””
log.info(”=” * 60)
log.info(“Verified Investing ? IBKR Trading Bot”)
log.info(f”Paper Trading: {PAPER_TRADING}”)
log.info(f”Budget per trade: ?{EUR_BUDGET_PER_TRADE} (${EUR_BUDGET_PER_TRADE * EUR_TO_USD_RATE:.0f})”)
log.info(f”Max trades/day: {MAX_TRADES_PER_DAY}”)
log.info(f”Email check interval: {EMAIL_CHECK_INTERVAL}s”)
log.info(”=” * 60)

```
monitor = EmailMonitor()
trader = IBKRTrader()

if not PAPER_TRADING:
    trader.connect()

log.info("Bot started. Monitoring for alerts...")

while True:
    try:
        reset_daily_counter()
        alerts = monitor.check_for_alerts()

        for alert in alerts:
            log_alert(alert)

            if not alert.get("parsed"):
                log.warning(f"Could not parse alert: {alert.get('raw_subject', 'unknown')}")
                continue

            # Safety check
            issues = safety_check(alert)
            if issues:
                log.warning(f"Safety check failed for {alert['ticker']}: {issues}")
                continue

            # Place order
            result = trader.place_bracket_order(alert)
            log.info(f"Order result: {result['status']}")

        time.sleep(EMAIL_CHECK_INTERVAL)

    except KeyboardInterrupt:
        log.info("Bot stopped by user.")
        break
    except Exception as e:
        log.error(f"Main loop error: {e}")
        time.sleep(EMAIL_CHECK_INTERVAL)
```

if **name** == “**main**”:
main()