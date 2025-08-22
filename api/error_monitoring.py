# Enhanced Error Monitoring and Logging System
# Provides comprehensive error tracking, analytics, and alerting

import time
import traceback
import json
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import hashlib
import uuid

try:
    from logging_config import get_logger
    from metrics import MetricsCollector
    logger = get_logger(__name__)
except ImportError:
    import logging
    logger = logging.getLogger(__name__)
    MetricsCollector = None

class ErrorSeverity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"

class ErrorCategory(str, Enum):
    DATABASE = "database"
    EXTERNAL_API = "external_api"
    VALIDATION = "validation"
    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"
    BUSINESS_LOGIC = "business_logic"
    SYSTEM = "system"
    NETWORK = "network"
    TIMEOUT = "timeout"
    UNKNOWN = "unknown"

@dataclass
class ErrorContext:
    """Context information for errors"""
    request_id: Optional[str] = None
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    endpoint: Optional[str] = None
    method: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    additional_data: Optional[Dict[str, Any]] = None

@dataclass
class ErrorDetails:
    """Detailed error information"""
    id: str
    timestamp: datetime
    error_type: str
    message: str
    category: ErrorCategory
    severity: ErrorSeverity
    context: ErrorContext
    stack_trace: Optional[str] = None
    error_hash: Optional[str] = None
    count: int = 1
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None
    resolved: bool = False
    tags: List[str] = None

    def __post_init__(self):
        if self.tags is None:
            self.tags = []
        if self.first_seen is None:
            self.first_seen = self.timestamp
        if self.last_seen is None:
            self.last_seen = self.timestamp

class ErrorMonitor:
    """Comprehensive error monitoring and analytics system"""
    
    def __init__(self, max_errors: int = 50000, retention_days: int = 30):
        self.max_errors = max_errors
        self.retention_days = retention_days
        self.errors: List[ErrorDetails] = []
        self.error_patterns: Dict[str, ErrorDetails] = {}
        self.metrics_collector = MetricsCollector() if MetricsCollector else None
        
        # Alert thresholds
        self.alert_thresholds = {
            ErrorSeverity.CRITICAL: 1,  # Alert immediately
            ErrorSeverity.HIGH: 5,      # Alert after 5 occurrences
            ErrorSeverity.MEDIUM: 20,   # Alert after 20 occurrences
            ErrorSeverity.LOW: 100,     # Alert after 100 occurrences
        }
        
        # Rate limiting for alerts
        self.alert_cooldown = timedelta(minutes=15)
        self.last_alerts: Dict[str, datetime] = {}

    def capture_error(
        self,
        error: Exception,
        context: ErrorContext,
        severity: ErrorSeverity = ErrorSeverity.MEDIUM,
        category: ErrorCategory = ErrorCategory.UNKNOWN,
        tags: List[str] = None
    ) -> str:
        """Capture and process an error with full context"""
        
        # Generate error ID
        error_id = str(uuid.uuid4())
        
        # Create error details
        error_details = ErrorDetails(
            id=error_id,
            timestamp=datetime.utcnow(),
            error_type=error.__class__.__name__,
            message=str(error),
            category=category,
            severity=severity,
            context=context,
            stack_trace=traceback.format_exc(),
            tags=tags or []
        )
        
        # Generate error hash for deduplication
        error_details.error_hash = self._generate_error_hash(error_details)
        
        # Check for duplicate errors
        if error_details.error_hash in self.error_patterns:
            existing_error = self.error_patterns[error_details.error_hash]
            existing_error.count += 1
            existing_error.last_seen = error_details.timestamp
            
            # Use existing error for further processing
            error_details = existing_error
        else:
            # New error pattern
            self.error_patterns[error_details.error_hash] = error_details
            self.errors.append(error_details)
        
        # Log the error
        self._log_error(error_details)
        
        # Record metrics
        self._record_metrics(error_details)
        
        # Check for alerting
        self._check_alerts(error_details)
        
        # Cleanup old errors
        self._cleanup_old_errors()
        
        return error_id

    def _generate_error_hash(self, error_details: ErrorDetails) -> str:
        """Generate hash for error deduplication"""
        hash_input = f"{error_details.error_type}:{error_details.message}:{error_details.context.endpoint}"
        return hashlib.md5(hash_input.encode()).hexdigest()

    def _log_error(self, error_details: ErrorDetails):
        """Log error with appropriate level"""
        log_data = {
            "error_id": error_details.id,
            "error_type": error_details.error_type,
            "category": error_details.category.value,
            "severity": error_details.severity.value,
            "count": error_details.count,
            "endpoint": error_details.context.endpoint,
            "user_id": error_details.context.user_id,
            "request_id": error_details.context.request_id,
            "tags": error_details.tags
        }
        
        if error_details.severity in [ErrorSeverity.CRITICAL, ErrorSeverity.HIGH]:
            logger.error(f"[{error_details.severity.value.upper()}] {error_details.message}", 
                        **log_data, 
                        exc_info=error_details.stack_trace)
        elif error_details.severity == ErrorSeverity.MEDIUM:
            logger.warning(f"[{error_details.severity.value.upper()}] {error_details.message}", 
                          **log_data)
        else:
            logger.info(f"[{error_details.severity.value.upper()}] {error_details.message}", 
                       **log_data)

    def _record_metrics(self, error_details: ErrorDetails):
        """Record error metrics for monitoring"""
        if not self.metrics_collector:
            return
        
        try:
            self.metrics_collector.record_error(
                error_type=error_details.error_type,
                category=error_details.category.value,
                severity=error_details.severity.value,
                endpoint=error_details.context.endpoint,
                user_id=error_details.context.user_id
            )
        except Exception as e:
            logger.warning("Failed to record error metrics", error=str(e))

    def _check_alerts(self, error_details: ErrorDetails):
        """Check if error should trigger an alert"""
        threshold = self.alert_thresholds.get(error_details.severity, 100)
        
        if error_details.count >= threshold:
            alert_key = f"{error_details.error_hash}:{error_details.severity.value}"
            
            # Check cooldown
            if alert_key in self.last_alerts:
                time_since_last = datetime.utcnow() - self.last_alerts[alert_key]
                if time_since_last < self.alert_cooldown:
                    return
            
            # Trigger alert
            self._trigger_alert(error_details)
            self.last_alerts[alert_key] = datetime.utcnow()

    def _trigger_alert(self, error_details: ErrorDetails):
        """Trigger error alert (implement integration with alerting system)"""
        alert_data = {
            "error_id": error_details.id,
            "severity": error_details.severity.value,
            "message": error_details.message,
            "count": error_details.count,
            "first_seen": error_details.first_seen.isoformat(),
            "last_seen": error_details.last_seen.isoformat(),
            "endpoint": error_details.context.endpoint,
            "category": error_details.category.value
        }
        
        logger.critical("ERROR ALERT TRIGGERED", **alert_data)
        
        # TODO: Integrate with external alerting systems
        # - Send to Slack/Teams
        # - Create PagerDuty incident
        # - Send email notification
        # - Update monitoring dashboard

    def _cleanup_old_errors(self):
        """Remove old errors based on retention policy"""
        cutoff_time = datetime.utcnow() - timedelta(days=self.retention_days)
        
        # Remove old errors
        self.errors = [e for e in self.errors if e.last_seen > cutoff_time]
        
        # Remove old patterns
        old_patterns = [
            hash_key for hash_key, error in self.error_patterns.items() 
            if error.last_seen < cutoff_time
        ]
        for hash_key in old_patterns:
            del self.error_patterns[hash_key]
        
        # Limit total error count
        if len(self.errors) > self.max_errors:
            # Keep most recent errors
            self.errors.sort(key=lambda x: x.last_seen, reverse=True)
            self.errors = self.errors[:self.max_errors]

    def get_error_stats(self, hours: int = 24) -> Dict[str, Any]:
        """Get error statistics for the specified time period"""
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        recent_errors = [e for e in self.errors if e.last_seen > cutoff_time]
        
        # Count by severity
        severity_counts = {}
        for severity in ErrorSeverity:
            severity_counts[severity.value] = len([e for e in recent_errors if e.severity == severity])
        
        # Count by category
        category_counts = {}
        for category in ErrorCategory:
            category_counts[category.value] = len([e for e in recent_errors if e.category == category])
        
        # Top error patterns
        top_patterns = sorted(
            [e for e in recent_errors],
            key=lambda x: x.count,
            reverse=True
        )[:10]
        
        # Error rate over time (hourly buckets)
        hourly_rates = {}
        for i in range(hours):
            hour_start = datetime.utcnow() - timedelta(hours=i+1)
            hour_end = datetime.utcnow() - timedelta(hours=i)
            hour_errors = [e for e in recent_errors if hour_start <= e.last_seen < hour_end]
            hourly_rates[f"{i}h_ago"] = len(hour_errors)
        
        return {
            "total_errors": len(recent_errors),
            "unique_patterns": len(set(e.error_hash for e in recent_errors)),
            "severity_breakdown": severity_counts,
            "category_breakdown": category_counts,
            "top_error_patterns": [
                {
                    "error_type": e.error_type,
                    "message": e.message[:100],
                    "count": e.count,
                    "severity": e.severity.value,
                    "category": e.category.value,
                    "first_seen": e.first_seen.isoformat(),
                    "last_seen": e.last_seen.isoformat()
                }
                for e in top_patterns
            ],
            "hourly_rates": hourly_rates,
            "timestamp": datetime.utcnow().isoformat()
        }

    def get_error_details(self, error_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a specific error"""
        for error in self.errors:
            if error.id == error_id:
                return {
                    **asdict(error),
                    "timestamp": error.timestamp.isoformat(),
                    "first_seen": error.first_seen.isoformat(),
                    "last_seen": error.last_seen.isoformat()
                }
        return None

    def mark_resolved(self, error_hash: str) -> bool:
        """Mark an error pattern as resolved"""
        if error_hash in self.error_patterns:
            self.error_patterns[error_hash].resolved = True
            logger.info("Error pattern marked as resolved", error_hash=error_hash)
            return True
        return False

    def get_health_score(self) -> Dict[str, Any]:
        """Calculate system health score based on error patterns"""
        recent_errors = [
            e for e in self.errors 
            if e.last_seen > datetime.utcnow() - timedelta(hours=1)
        ]
        
        # Calculate weighted error score
        error_score = 0
        severity_weights = {
            ErrorSeverity.CRITICAL: 10,
            ErrorSeverity.HIGH: 5,
            ErrorSeverity.MEDIUM: 2,
            ErrorSeverity.LOW: 1,
            ErrorSeverity.INFO: 0
        }
        
        for error in recent_errors:
            error_score += severity_weights.get(error.severity, 1) * error.count
        
        # Calculate health score (0-100, where 100 is perfect health)
        max_acceptable_score = 50  # Threshold for acceptable error level
        health_score = max(0, 100 - (error_score / max_acceptable_score * 100))
        
        # Determine health status
        if health_score >= 90:
            status = "excellent"
        elif health_score >= 75:
            status = "good"
        elif health_score >= 50:
            status = "fair"
        elif health_score >= 25:
            status = "poor"
        else:
            status = "critical"
        
        return {
            "health_score": round(health_score, 2),
            "status": status,
            "recent_error_count": len(recent_errors),
            "critical_errors": len([e for e in recent_errors if e.severity == ErrorSeverity.CRITICAL]),
            "high_errors": len([e for e in recent_errors if e.severity == ErrorSeverity.HIGH]),
            "recommendations": self._get_health_recommendations(recent_errors, health_score),
            "timestamp": datetime.utcnow().isoformat()
        }

    def _get_health_recommendations(self, recent_errors: List[ErrorDetails], health_score: float) -> List[str]:
        """Get health improvement recommendations"""
        recommendations = []
        
        if health_score < 50:
            recommendations.append("Critical: Immediate attention required for system stability")
        
        critical_errors = [e for e in recent_errors if e.severity == ErrorSeverity.CRITICAL]
        if critical_errors:
            recommendations.append(f"Address {len(critical_errors)} critical errors immediately")
        
        database_errors = [e for e in recent_errors if e.category == ErrorCategory.DATABASE]
        if len(database_errors) > 5:
            recommendations.append("High database error rate detected - check database health")
        
        external_api_errors = [e for e in recent_errors if e.category == ErrorCategory.EXTERNAL_API]
        if len(external_api_errors) > 10:
            recommendations.append("External API issues detected - review integrations")
        
        if not recommendations and health_score < 90:
            recommendations.append("Monitor error trends and consider preventive measures")
        
        return recommendations

# Global error monitor instance
error_monitor = ErrorMonitor()

# Utility functions for easy error reporting
def capture_error(
    error: Exception,
    request_id: str = None,
    user_id: str = None,
    endpoint: str = None,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    tags: List[str] = None,
    **kwargs
) -> str:
    """Capture error with context information"""
    context = ErrorContext(
        request_id=request_id,
        user_id=user_id,
        endpoint=endpoint,
        additional_data=kwargs
    )
    
    return error_monitor.capture_error(error, context, severity, category, tags)

def get_error_stats(hours: int = 24) -> Dict[str, Any]:
    """Get error statistics"""
    return error_monitor.get_error_stats(hours)

def get_health_score() -> Dict[str, Any]:
    """Get system health score"""
    return error_monitor.get_health_score()

def mark_error_resolved(error_hash: str) -> bool:
    """Mark error as resolved"""
    return error_monitor.mark_resolved(error_hash)