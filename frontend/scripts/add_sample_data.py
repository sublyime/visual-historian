# scripts/add_sample_data.py
import requests
import random
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

def create_sample_data():
    # Sample data sources with different configurations
    sample_sources = [
        {
            "name": "Houston Temperature Sensor",
            "source_type": "temperature",
            "config": {
                "latitude": 29.7604,
                "longitude": -95.3698,
                "unit": "celsius",
                "location": "Houston, TX"
            }
        },
        {
            "name": "Dallas Humidity Monitor",
            "source_type": "humidity", 
            "config": {
                "latitude": 32.7767,
                "longitude": -96.7970,
                "unit": "percent",
                "location": "Dallas, TX"
            }
        },
        {
            "name": "Austin Pressure Gauge",
            "source_type": "pressure",
            "config": {
                "latitude": 30.2672,
                "longitude": -97.7431,
                "unit": "hPa",
                "location": "Austin, TX"
            }
        },
        {
            "name": "San Antonio Wind Speed",
            "source_type": "wind_speed",
            "config": {
                "latitude": 29.4241,
                "longitude": -98.4936,
                "unit": "m/s",
                "location": "San Antonio, TX"
            }
        }
    ]
    
    created_sources = []
    
    # Create data sources
    for source in sample_sources:
        try:
            response = requests.post(f"{BASE_URL}/datasources/", json=source)
            if response.status_code == 200:
                created_source = response.json()
                created_sources.append(created_source)
                print(f"Created data source: {created_source['name']} (ID: {created_source['id']})")
            else:
                print(f"Failed to create source {source['name']}: {response.text}")
        except Exception as e:
            print(f"Error creating source {source['name']}: {e}")
    
    # Create sample data points for each source
    for source in created_sources:
        source_id = source['id']
        source_type = source['source_type']
        
        # Generate 50 data points over the last 24 hours
        base_time = datetime.now() - timedelta(hours=24)
        
        for i in range(50):
            timestamp_offset = timedelta(minutes=i * 30)  # Every 30 minutes
            
            # Generate realistic values based on source type
            if source_type == "temperature":
                value = round(random.uniform(20, 35), 2)  # 20-35°C
            elif source_type == "humidity":
                value = round(random.uniform(30, 80), 2)  # 30-80%
            elif source_type == "pressure":
                value = round(random.uniform(1000, 1020), 2)  # 1000-1020 hPa
            elif source_type == "wind_speed":
                value = round(random.uniform(0, 15), 2)  # 0-15 m/s
            else:
                value = round(random.uniform(0, 100), 2)
            
            data_point = {
                "value": value,
                "source_id": source_id
            }
            
            try:
                response = requests.post(f"{BASE_URL}/datapoints/", json=data_point)
                if response.status_code != 200:
                    print(f"Failed to create data point for source {source_id}: {response.text}")
            except Exception as e:
                print(f"Error creating data point for source {source_id}: {e}")
        
        print(f"Created 50 data points for {source['name']}")

if __name__ == "__main__":
    print("Adding sample data to the Visual Data Historian...")
    create_sample_data()
    print("Sample data creation completed!")