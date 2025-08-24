# Monitoring and Observability

PromptPilot includes a comprehensive monitoring and observability stack to help you track the health, performance, and usage of your application.

## 📊 Overview

The monitoring system provides:

1. **Infrastructure Monitoring**: CPU, memory, disk usage
2. **Application Metrics**: HTTP requests, response times, error rates
3. **Business Metrics**: Prompt executions, pipeline runs, user activity
4. **Alerting**: Automated notifications for critical issues
5. **Visualization**: Dashboards for real-time insights

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Application   │────│   Prometheus     │────│    Grafana      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
       │                       │                       │
       │                       │                       │
       ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Health Checks  │    │  Metrics Export  │    │ Alert Manager   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Components

### Prometheus
Prometheus collects and stores metrics from your PromptPilot application.

**Key Metrics Collected:**
- HTTP request rate and duration
- Prompt execution counts and performance
- Pipeline execution statistics
- System resource usage (CPU, memory, disk)
- Error rates and success percentages

### Grafana
Grafana provides visualization dashboards for your metrics.

**Pre-built Dashboards:**
- System Overview
- HTTP Performance
- Prompt Analytics
- Pipeline Metrics
- Resource Utilization

### Alertmanager
Alertmanager handles alerts sent by Prometheus.

**Default Alerts:**
- High error rates
- Slow response times
- High resource usage
- Service downtime

### Node Exporter
Node Exporter exposes system-level metrics.

**Metrics Collected:**
- CPU usage
- Memory usage
- Disk I/O
- Network statistics

## 📈 Metrics

### HTTP Metrics
- `http_requests_total`: Total HTTP requests
- `http_request_duration_seconds`: HTTP request duration
- `http_requests_in_progress`: HTTP requests currently in progress

### Business Metrics
- `prompt_executions_total`: Total prompt executions
- `pipeline_executions_total`: Total pipeline executions
- `active_users`: Number of active users
- `prompt_total`: Total number of prompts
- `pipeline_total`: Total number of pipelines

### System Metrics
- `process_cpu_seconds_total`: Total CPU time
- `process_resident_memory_bytes`: Memory usage
- `process_open_fds`: Open file descriptors

## 🛠️ Setup

### Docker Compose
The monitoring stack can be deployed using Docker Compose:

```bash
cd monitoring
docker-compose up -d
```

This will start:
- Prometheus on port 9090
- Grafana on port 3001
- Node Exporter on port 9100
- Alertmanager on port 9093
- cAdvisor on port 8080

### Configuration

#### Prometheus
Edit `monitoring/prometheus/prometheus.yml` to configure scrape targets:

```yaml
scrape_configs:
  - job_name: 'promptpilot-api'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/metrics'
```

#### Grafana
Grafana is pre-configured with:
- Prometheus datasource
- Pre-built dashboards
- Default admin credentials (admin/admin)

#### Alertmanager
Edit `monitoring/alertmanager/alertmanager.yml` to configure alert receivers:

```yaml
receivers:
  - name: 'webhook'
    webhook_configs:
      - url: 'http://localhost:8000/api/v1/alerts'
```

## 📊 Dashboards

### System Overview
Displays overall system health including:
- CPU, memory, and disk usage
- HTTP request rates
- Error rates
- Uptime

### HTTP Performance
Shows HTTP performance metrics:
- Request rate by endpoint
- Response time percentiles
- Error distribution

### Prompt Analytics
Business metrics for prompts:
- Execution counts
- Success rates
- Average execution time
- Cost analysis

### Pipeline Metrics
Business metrics for pipelines:
- Execution counts
- Success rates
- Average execution time
- Cost analysis

## ⚠️ Alerts

### Default Alerts
The system includes several default alerts:

1. **High Error Rate**: Triggered when error rate exceeds 5%
2. **Slow Responses**: Triggered when 95th percentile response time exceeds 1 second
3. **High CPU Usage**: Triggered when CPU usage exceeds 80%
4. **High Memory Usage**: Triggered when memory usage exceeds 85%
5. **Service Down**: Triggered when service is unreachable

### Custom Alerts
To add custom alerts, edit the Prometheus rules file:

```yaml
groups:
  - name: custom.rules
    rules:
      - alert: HighPromptFailureRate
        expr: rate(prompt_executions_total{status="failed"}[5m]) / rate(prompt_executions_total[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High prompt failure rate"
          description: "Prompt failure rate is above 10%"
```

## 🔧 API Integration

The application exposes metrics through the `/metrics` endpoint:

```bash
curl http://localhost:8000/metrics
```

Example metrics output:
```
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",endpoint="/api/v1/prompts",status="200"} 42

# HELP prompt_executions_total Total prompt executions
# TYPE prompt_executions_total counter
prompt_executions_total{prompt_id="123",status="success"} 15
```

## 📈 Custom Metrics

To add custom metrics to your application:

1. Import the Prometheus client:
```python
from prometheus_client import Counter, Histogram
```

2. Define your metrics:
```python
CUSTOM_METRIC = Counter('custom_metric_total', 'Description of metric')
```

3. Use in your code:
```python
CUSTOM_METRIC.inc()
```

## 🛡️ Security

### Network Security
- All monitoring services are isolated in a dedicated network
- Services are not exposed to the public internet by default
- Access is controlled through firewall rules

### Authentication
- Grafana requires authentication (default: admin/admin)
- Prometheus has no built-in authentication
- Alertmanager has no built-in authentication

### Encryption
- All communication between components is unencrypted by default
- Use reverse proxies with TLS termination for production

## 📊 Performance Considerations

### Resource Usage
The monitoring stack typically requires:
- CPU: 0.1-0.5 cores
- Memory: 100-500 MB
- Disk: 2-10 GB (depending on retention)

### Scaling
For large deployments:
- Use Prometheus federation for horizontal scaling
- Increase retention periods as needed
- Use remote storage for long-term metrics

## 🧪 Testing

### Health Checks
The application provides health check endpoints:
- `/health`: Application health
- `/metrics`: Prometheus metrics

### Load Testing
Use tools like:
- Apache Bench (ab)
- wrk
- k6

Example load test:
```bash
ab -n 1000 -c 10 http://localhost:8000/api/v1/prompts
```

## 🚨 Troubleshooting

### Common Issues

1. **Metrics not showing up**
   - Check if the application is running
   - Verify Prometheus scrape configuration
   - Check network connectivity

2. **Grafana dashboards empty**
   - Verify Prometheus datasource configuration
   - Check if metrics are being collected
   - Restart Grafana if needed

3. **Alerts not firing**
   - Check Alertmanager configuration
   - Verify alert rules in Prometheus
   - Check notification channels

### Logs
Check logs for each component:
```bash
docker-compose logs prometheus
docker-compose logs grafana
docker-compose logs alertmanager
```

## 📚 Further Reading

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Alertmanager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)
- [Node Exporter Documentation](https://github.com/prometheus/node_exporter)

## 🤝 Contributing

To contribute to the monitoring system:
1. Fork the repository
2. Make your changes
3. Test thoroughly
4. Submit a pull request

Areas for improvement:
- Additional dashboards
- More alert rules
- Better documentation
- Performance optimizations