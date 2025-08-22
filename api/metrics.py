from prometheus_client import Counter, Histogram, Gauge, Info, start_http_server
from typing import Dict, List, Optional
import time
import psutil
import threading
from datetime import datetime, timedelta
from collections import defaultdict, deque
import json

# Prometheus metrics for monitoring
PROMPT_EXECUTIONS = Counter(
    'promptpilot_prompt_executions_total',
    'Total number of prompt executions',
    ['prompt_id', 'user_id', 'provider', 'status']
)

PROMPT_EXECUTION_DURATION = Histogram(
    'promptpilot_prompt_execution_duration_seconds',
    'Duration of prompt executions',
    ['prompt_id', 'provider']
)

PIPELINE_EXECUTIONS = Counter(
    'promptpilot_pipeline_executions_total',
    'Total number of pipeline executions',
    ['pipeline_id', 'user_id', 'status']
)

PIPELINE_EXECUTION_DURATION = Histogram(
    'promptpilot_pipeline_execution_duration_seconds',
    'Duration of pipeline executions',
    ['pipeline_id']
)

API_REQUESTS = Counter(
    'promptpilot_api_requests_total',
    'Total number of API requests',
    ['method', 'endpoint', 'status']
)

API_REQUEST_DURATION = Histogram(
    'promptpilot_api_request_duration_seconds',
    'Duration of API requests',
    ['method', 'endpoint']
)

ACTIVE_USERS = Gauge(
    'promptpilot_active_users',
    'Number of active users'
)

SYSTEM_CPU_USAGE = Gauge(
    'promptpilot_system_cpu_usage_percent',
    'System CPU usage percentage'
)

SYSTEM_MEMORY_USAGE = Gauge(
    'promptpilot_system_memory_usage_bytes',
    'System memory usage in bytes'
)

DATABASE_CONNECTIONS = Gauge(
    'promptpilot_database_connections',
    'Number of active database connections'
)

LLM_API_CALLS = Counter(
    'promptpilot_llm_api_calls_total',
    'Total number of LLM API calls',
    ['provider', 'model', 'status']
)

LLM_API_DURATION = Histogram(
    'promptpilot_llm_api_duration_seconds',
    'Duration of LLM API calls',
    ['provider', 'model']
)

LLM_TOKEN_USAGE = Counter(
    'promptpilot_llm_tokens_total',
    'Total number of tokens used',
    ['provider', 'model', 'type']  # type: input/output
)

LLM_COST = Counter(
    'promptpilot_llm_cost_total',
    'Total cost of LLM usage',
    ['provider', 'model']
)

ERROR_COUNT = Counter(
    'promptpilot_errors_total',
    'Total number of errors',
    ['error_type', 'component']
)

APPLICATION_INFO = Info(
    'promptpilot_application_info',
    'Application information'
)

class MetricsCollector:
    """Centralized metrics collection and reporting"""
    
    def __init__(self):
        self.start_time = datetime.utcnow()
        self.active_sessions = set()
        self.recent_requests = deque(maxlen=1000)  # Keep last 1000 requests
        self.system_metrics_thread = None
        self.is_running = False
        
        # Set application info
        APPLICATION_INFO.info({
            'version': '1.0.0',
            'environment': 'production',
            'start_time': self.start_time.isoformat()
        })
    
    def start_metrics_server(self, port: int = 8001):
        """Start Prometheus metrics server"""
        start_http_server(port)
        print(f"Metrics server started on port {port}")
    
    def start_system_monitoring(self):
        """Start background system monitoring"""
        self.is_running = True
        self.system_metrics_thread = threading.Thread(target=self._collect_system_metrics)
        self.system_metrics_thread.daemon = True
        self.system_metrics_thread.start()
    
    def stop_system_monitoring(self):
        """Stop background system monitoring"""
        self.is_running = False
        if self.system_metrics_thread:
            self.system_metrics_thread.join()
    
    def _collect_system_metrics(self):
        """Collect system metrics in background"""
        while self.is_running:
            try:
                # CPU usage
                cpu_percent = psutil.cpu_percent(interval=1)
                SYSTEM_CPU_USAGE.set(cpu_percent)
                
                # Memory usage
                memory = psutil.virtual_memory()
                SYSTEM_MEMORY_USAGE.set(memory.used)
                
                # Active users (from recent requests)
                recent_users = set()
                cutoff_time = datetime.utcnow() - timedelta(minutes=5)
                for req in list(self.recent_requests):
                    if req['timestamp'] > cutoff_time and req.get('user_id'):
                        recent_users.add(req['user_id'])
                
                ACTIVE_USERS.set(len(recent_users))
                
            except Exception as e:
                print(f"Error collecting system metrics: {e}")
            
            time.sleep(30)  # Collect every 30 seconds
    
    def record_api_request(self, method: str, endpoint: str, status_code: int, duration: float, user_id: str = None):
        """Record API request metrics"""
        API_REQUESTS.labels(method=method, endpoint=endpoint, status=str(status_code)).inc()
        API_REQUEST_DURATION.labels(method=method, endpoint=endpoint).observe(duration)
        
        # Track for active users calculation
        self.recent_requests.append({
            'timestamp': datetime.utcnow(),
            'user_id': user_id,
            'method': method,
            'endpoint': endpoint,
            'status': status_code
        })
    
    def record_prompt_execution(self, prompt_id: str, user_id: str, provider: str, status: str, duration: float):
        """Record prompt execution metrics"""
        PROMPT_EXECUTIONS.labels(
            prompt_id=prompt_id,
            user_id=user_id,
            provider=provider,
            status=status
        ).inc()
        
        PROMPT_EXECUTION_DURATION.labels(
            prompt_id=prompt_id,
            provider=provider
        ).observe(duration)
    
    def record_pipeline_execution(self, pipeline_id: str, user_id: str, status: str, duration: float):
        """Record pipeline execution metrics"""
        PIPELINE_EXECUTIONS.labels(
            pipeline_id=pipeline_id,
            user_id=user_id,
            status=status
        ).inc()
        
        PIPELINE_EXECUTION_DURATION.labels(
            pipeline_id=pipeline_id
        ).observe(duration)
    
    def record_llm_api_call(self, provider: str, model: str, status: str, duration: float, 
                          input_tokens: int = 0, output_tokens: int = 0, cost: float = 0):
        """Record LLM API call metrics"""
        LLM_API_CALLS.labels(provider=provider, model=model, status=status).inc()
        LLM_API_DURATION.labels(provider=provider, model=model).observe(duration)
        
        if input_tokens > 0:
            LLM_TOKEN_USAGE.labels(provider=provider, model=model, type='input').inc(input_tokens)
        
        if output_tokens > 0:
            LLM_TOKEN_USAGE.labels(provider=provider, model=model, type='output').inc(output_tokens)
        
        if cost > 0:
            LLM_COST.labels(provider=provider, model=model).inc(cost)
    
    def record_error(self, error_type: str, component: str):
        """Record error occurrence"""
        ERROR_COUNT.labels(error_type=error_type, component=component).inc()
    
    def set_database_connections(self, count: int):
        """Set current database connection count"""
        DATABASE_CONNECTIONS.set(count)
    
    def get_health_status(self) -> Dict:
        """Get comprehensive health status"""
        uptime = datetime.utcnow() - self.start_time
        
        # Get recent error rate
        recent_errors = 0
        recent_requests_count = 0
        cutoff_time = datetime.utcnow() - timedelta(minutes=5)
        
        for req in list(self.recent_requests):
            if req['timestamp'] > cutoff_time:
                recent_requests_count += 1
                if req['status'] >= 400:
                    recent_errors += 1
        
        error_rate = (recent_errors / recent_requests_count * 100) if recent_requests_count > 0 else 0
        
        return {
            'status': 'healthy' if error_rate < 10 else 'degraded',
            'uptime_seconds': uptime.total_seconds(),
            'error_rate_percent': round(error_rate, 2),
            'active_users': len(self.active_sessions),
            'recent_requests': recent_requests_count,
            'system': {
                'cpu_percent': psutil.cpu_percent(),
                'memory_percent': psutil.virtual_memory().percent,
                'disk_percent': psutil.disk_usage('/').percent
            }
        }

class HealthChecker:
    """Comprehensive health checking for all components"""
    
    def __init__(self, metrics_collector: MetricsCollector):
        self.metrics_collector = metrics_collector
        self.checks = {}
    
    def register_check(self, name: str, check_func):
        """Register a health check function"""
        self.checks[name] = check_func
    
    async def run_health_checks(self) -> Dict:
        """Run all registered health checks"""
        results = {}
        overall_status = 'healthy'
        
        for name, check_func in self.checks.items():
            try:
                result = await check_func()
                results[name] = result
                
                if result.get('status') != 'healthy':
                    overall_status = 'degraded'
                    
            except Exception as e:
                results[name] = {
                    'status': 'error',
                    'message': str(e)
                }
                overall_status = 'error'
        
        # Add system metrics
        system_status = self.metrics_collector.get_health_status()
        results['system'] = system_status
        
        if system_status['status'] != 'healthy':
            overall_status = 'degraded'
        
        return {
            'status': overall_status,
            'timestamp': datetime.utcnow().isoformat(),
            'checks': results
        }

class AlertManager:
    """Alert management for critical issues"""
    
    def __init__(self):
        self.alert_thresholds = {
            'error_rate': 10,  # percent
            'response_time': 5,  # seconds
            'cpu_usage': 80,  # percent
            'memory_usage': 85,  # percent
            'disk_usage': 90  # percent
        }
        self.active_alerts = {}
    
    def check_thresholds(self, metrics: Dict):
        """Check if any metrics exceed thresholds"""
        alerts = []
        
        # Check error rate
        if metrics.get('error_rate_percent', 0) > self.alert_thresholds['error_rate']:
            alerts.append({
                'type': 'high_error_rate',
                'level': 'warning',
                'message': f"Error rate {metrics['error_rate_percent']}% exceeds threshold {self.alert_thresholds['error_rate']}%"
            })
        
        # Check system metrics
        system = metrics.get('system', {})
        if system.get('cpu_percent', 0) > self.alert_thresholds['cpu_usage']:
            alerts.append({
                'type': 'high_cpu_usage',
                'level': 'warning',
                'message': f"CPU usage {system['cpu_percent']}% exceeds threshold {self.alert_thresholds['cpu_usage']}%"
            })
        
        if system.get('memory_percent', 0) > self.alert_thresholds['memory_usage']:
            alerts.append({
                'type': 'high_memory_usage',
                'level': 'warning',
                'message': f"Memory usage {system['memory_percent']}% exceeds threshold {self.alert_thresholds['memory_usage']}%"
            })
        
        return alerts
    
    def send_alert(self, alert: Dict):
        """Send alert notification (implement webhook/email/slack integration)"""
        print(f"ALERT: {alert}")
        # TODO: Implement actual alerting mechanism

# Global metrics collector instance
metrics_collector = MetricsCollector()
health_checker = HealthChecker(metrics_collector)
alert_manager = AlertManager()

def get_metrics_collector() -> MetricsCollector:
    """Get the global metrics collector"""
    return metrics_collector

def get_health_checker() -> HealthChecker:
    """Get the global health checker"""
    return health_checker

def get_alert_manager() -> AlertManager:
    """Get the global alert manager"""
    return alert_manager