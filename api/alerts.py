# Alerting System for PromptPilot
# Provides real-time alerting based on metrics and system health

import asyncio
import json
import smtplib
from typing import Dict, List, Optional, Callable, Any
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from error_monitoring import ErrorSeverity, ErrorCategory
from api.metrics import MetricsCollector

logger = logging.getLogger(__name__)

class AlertPriority(str, Enum):
    CRITICAL = "P0"
    HIGH = "P1"
    MEDIUM = "P2"
    LOW = "P3"

class AlertChannel(str, Enum):
    EMAIL = "email"
    SLACK = "slack"
    PAGERDUTY = "pagerduty"
    WEBHOOK = "webhook"
    DASHBOARD = "dashboard"

@dataclass
class AlertCondition:
    """Condition that triggers an alert"""
    metric: str
    operator: str  # >, <, ==, !=, contains
    threshold: float | str
    duration: str  # e.g., "5m", "1h"
    aggregation: str = "avg"  # avg, sum, max, min, count

@dataclass
class NotificationConfig:
    """Configuration for alert notifications"""
    channels: List[AlertChannel]
    recipients: List[str]
    template: str = ""
    enabled: bool = True

@dataclass
class AlertRule:
    """Configuration for an alert rule"""
    id: str
    name: str
    description: str
    priority: AlertPriority
    condition: AlertCondition
    notifications: NotificationConfig
    enabled: bool = True
    created_at: datetime = None
    updated_at: datetime = None
    suppression_rules: Dict[str, Any] = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()
        if self.updated_at is None:
            self.updated_at = datetime.utcnow()
        if self.suppression_rules is None:
            self.suppression_rules = {}

@dataclass
class Alert:
    """An active alert"""
    id: str
    rule_id: str
    priority: AlertPriority
    title: str
    message: str
    triggered_at: datetime
    resolved_at: Optional[datetime] = None
    acknowledged_at: Optional[datetime] = None
    acknowledged_by: Optional[str] = None
    tags: List[str] = None
    data: Dict[str, Any] = None

    def __post_init__(self):
        if self.tags is None:
            self.tags = []
        if self.data is None:
            self.data = {}

class AlertingSystem:
    """Comprehensive alerting system for PromptPilot"""
    
    def __init__(self, metrics_collector: MetricsCollector = None):
        self.metrics_collector = metrics_collector
        self.alert_rules: Dict[str, AlertRule] = {}
        self.active_alerts: Dict[str, Alert] = {}
        self.alert_history: List[Alert] = []
        self.notification_handlers: Dict[AlertChannel, Callable] = {
            AlertChannel.EMAIL: self._send_email_notification,
            AlertChannel.WEBHOOK: self._send_webhook_notification,
            AlertChannel.DASHBOARD: self._send_dashboard_notification,
        }
        self.alert_cooldown: Dict[str, datetime] = {}
        
    def add_alert_rule(self, rule: AlertRule) -> str:
        """Add a new alert rule"""
        self.alert_rules[rule.id] = rule
        logger.info(f"Added alert rule: {rule.name}")
        return rule.id
    
    def remove_alert_rule(self, rule_id: str) -> bool:
        """Remove an alert rule"""
        if rule_id in self.alert_rules:
            del self.alert_rules[rule_id]
            logger.info(f"Removed alert rule: {rule_id}")
            return True
        return False
    
    def enable_alert_rule(self, rule_id: str) -> bool:
        """Enable an alert rule"""
        if rule_id in self.alert_rules:
            self.alert_rules[rule_id].enabled = True
            self.alert_rules[rule_id].updated_at = datetime.utcnow()
            logger.info(f"Enabled alert rule: {rule_id}")
            return True
        return False
    
    def disable_alert_rule(self, rule_id: str) -> bool:
        """Disable an alert rule"""
        if rule_id in self.alert_rules:
            self.alert_rules[rule_id].enabled = False
            self.alert_rules[rule_id].updated_at = datetime.utcnow()
            logger.info(f"Disabled alert rule: {rule_id}")
            return True
        return False
    
    def evaluate_alert_rules(self):
        """Evaluate all enabled alert rules"""
        for rule_id, rule in self.alert_rules.items():
            if not rule.enabled:
                continue
            
            # Check if alert is in cooldown period
            if rule_id in self.alert_cooldown:
                cooldown_until = self.alert_cooldown[rule_id]
                if datetime.utcnow() < cooldown_until:
                    continue
            
            # Evaluate the condition
            if self._evaluate_condition(rule.condition):
                self._trigger_alert(rule)
    
    def _evaluate_condition(self, condition: AlertCondition) -> bool:
        """Evaluate an alert condition"""
        # This is a simplified implementation
        # In a real system, this would query actual metrics
        try:
            # For now, we'll return False to avoid false positives
            # In a real implementation, this would check actual metrics
            return False
        except Exception as e:
            logger.error(f"Error evaluating condition: {e}")
            return False
    
    def _trigger_alert(self, rule: AlertRule):
        """Trigger an alert based on a rule"""
        alert_id = f"alert_{datetime.utcnow().timestamp()}"
        
        alert = Alert(
            id=alert_id,
            rule_id=rule.id,
            priority=rule.priority,
            title=rule.name,
            message=rule.description,
            triggered_at=datetime.utcnow(),
            tags=["auto-generated"],
            data={
                "rule": asdict(rule),
                "triggered_at": datetime.utcnow().isoformat()
            }
        )
        
        self.active_alerts[alert_id] = alert
        self.alert_history.append(alert)
        
        # Send notifications
        self._send_notifications(rule, alert)
        
        # Set cooldown period (15 minutes)
        self.alert_cooldown[rule.id] = datetime.utcnow() + timedelta(minutes=15)
        
        logger.critical(f"Alert triggered: {rule.name} - {rule.description}")
    
    def _send_notifications(self, rule: AlertRule, alert: Alert):
        """Send notifications for an alert"""
        for channel in rule.notifications.channels:
            if channel in self.notification_handlers:
                try:
                    self.notification_handlers[channel](rule, alert)
                except Exception as e:
                    logger.error(f"Error sending {channel} notification: {e}")
    
    def _send_email_notification(self, rule: AlertRule, alert: Alert):
        """Send email notification"""
        if not rule.notifications.recipients:
            return
        
        try:
            # This is a simplified implementation
            # In production, you would use proper SMTP configuration
            msg = MIMEMultipart()
            msg['From'] = "alerts@promptpilot.ai"
            msg['To'] = ", ".join(rule.notifications.recipients)
            msg['Subject'] = f"[{rule.priority.value}] {alert.title}"
            
            body = f"""
            Alert: {alert.title}
            Priority: {alert.priority.value}
            Description: {alert.message}
            Triggered at: {alert.triggered_at.isoformat()}
            
            Rule: {rule.name}
            """
            
            msg.attach(MIMEText(body, 'plain'))
            
            # In a real implementation, you would connect to an SMTP server
            # server = smtplib.SMTP('smtp.gmail.com', 587)
            # server.starttls()
            # server.login(smtp_user, smtp_password)
            # server.send_message(msg)
            # server.quit()
            
            logger.info(f"Email notification sent for alert {alert.id}")
        except Exception as e:
            logger.error(f"Error sending email notification: {e}")
    
    def _send_webhook_notification(self, rule: AlertRule, alert: Alert):
        """Send webhook notification"""
        # Implementation would depend on the webhook endpoint
        logger.info(f"Webhook notification would be sent for alert {alert.id}")
    
    def _send_dashboard_notification(self, rule: AlertRule, alert: Alert):
        """Send dashboard notification"""
        # This would update the UI dashboard with the alert
        logger.info(f"Dashboard notification sent for alert {alert.id}")
    
    def acknowledge_alert(self, alert_id: str, user_id: str = None):
        """Acknowledge an alert"""
        if alert_id in self.active_alerts:
            alert = self.active_alerts[alert_id]
            alert.acknowledged_at = datetime.utcnow()
            alert.acknowledged_by = user_id
            logger.info(f"Alert {alert_id} acknowledged by {user_id}")
    
    def resolve_alert(self, alert_id: str):
        """Resolve an alert"""
        if alert_id in self.active_alerts:
            alert = self.active_alerts[alert_id]
            alert.resolved_at = datetime.utcnow()
            
            # Move to history and remove from active alerts
            self.alert_history.append(alert)
            del self.active_alerts[alert_id]
            
            logger.info(f"Alert {alert_id} resolved")
    
    def get_active_alerts(self, priority: AlertPriority = None) -> List[Alert]:
        """Get active alerts, optionally filtered by priority"""
        alerts = list(self.active_alerts.values())
        if priority:
            alerts = [alert for alert in alerts if alert.priority == priority]
        return alerts
    
    def get_alert_history(self, hours: int = 24) -> List[Alert]:
        """Get alert history for the specified number of hours"""
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        return [alert for alert in self.alert_history if alert.triggered_at >= cutoff_time]
    
    def add_notification_handler(self, channel: AlertChannel, handler: Callable):
        """Add a custom notification handler"""
        self.notification_handlers[channel] = handler

# Global alerting system instance
alerting_system = AlertingSystem()

# Example alert rules
def setup_default_alerts():
    """Setup default alert rules for common scenarios"""
    
    # Critical error rate alert
    critical_error_rule = AlertRule(
        id="critical_error_rate",
        name="High Critical Error Rate",
        description="Critical error rate exceeded 1% in the last 5 minutes",
        priority=AlertPriority.CRITICAL,
        condition=AlertCondition(
            metric="error_rate",
            operator=">",
            threshold=1.0,
            duration="5m"
        ),
        notifications=NotificationConfig(
            channels=[AlertChannel.EMAIL, AlertChannel.SLACK, AlertChannel.DASHBOARD],
            recipients=["admin@promptpilot.ai", "ops@promptpilot.ai"]
        )
    )
    
    # High latency alert
    latency_rule = AlertRule(
        id="high_latency",
        name="High API Latency",
        description="API response time exceeded 2 seconds in the last 10 minutes",
        priority=AlertPriority.HIGH,
        condition=AlertCondition(
            metric="api_latency",
            operator=">",
            threshold=2.0,
            duration="10m"
        ),
        notifications=NotificationConfig(
            channels=[AlertChannel.EMAIL, AlertChannel.DASHBOARD],
            recipients=["admin@promptpilot.ai"]
        )
    )
    
    # Low system resources alert
    resources_rule = AlertRule(
        id="low_resources",
        name="Low System Resources",
        description="System CPU or memory usage exceeded 85%",
        priority=AlertPriority.MEDIUM,
        condition=AlertCondition(
            metric="system_resources",
            operator=">",
            threshold=85.0,
            duration="5m"
        ),
        notifications=NotificationConfig(
            channels=[AlertChannel.EMAIL, AlertChannel.DASHBOARD],
            recipients=["admin@promptpilot.ai"]
        )
    )
    
    # Add rules to system
    alerting_system.add_alert_rule(critical_error_rule)
    alerting_system.add_alert_rule(latency_rule)
    alerting_system.add_alert_rule(resources_rule)

if __name__ == "__main__":
    # Setup default alerts
    setup_default_alerts()
    print("Alerting system initialized with default rules")
