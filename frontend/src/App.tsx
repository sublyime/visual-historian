import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Typography, List, ListItem, ListItemText, CircularProgress, Alert, Paper, Grid } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './App.css';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Fix for default Leaflet icon not showing up
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface DataPoint {
  id: number;
  timestamp: string;
  value: number;
  source_id: number;
}

interface DataSource {
  id: number;
  name: string;
  source_type: string;
  config: { [key: string]: any };
}

const App: React.FC = () => {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);

  // Effect to fetch the list of data sources
  useEffect(() => {
    const fetchDataSources = async () => {
      try {
        const response = await axios.get('http://localhost:8000/datasources/');
        setDataSources(response.data);
      } catch (err) {
        setError('Failed to fetch data sources. Make sure your backend is running and CORS is enabled.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDataSources();
  }, []);

  // Effect to fetch data points when a data source is selected
  useEffect(() => {
    if (selectedSourceId !== null) {
      const fetchDataPoints = async () => {
        try {
          const response = await axios.get(`http://localhost:8000/datasources/${selectedSourceId}/datapoints/`);
          setDataPoints(response.data);
        } catch (err) {
          setError('Failed to fetch data points for the selected source.');
          console.error(err);
        }
      };
      fetchDataPoints();
    }
  }, [selectedSourceId]);

  const handleSourceClick = (id: number) => {
    setSelectedSourceId(id);
  };
  
  const chartData = {
    labels: dataPoints.map(dp => new Date(dp.timestamp).toLocaleString()),
    datasets: [
      {
        label: `Value for Source ID: ${selectedSourceId}`,
        data: dataPoints.map(dp => dp.value),
        fill: false,
        backgroundColor: 'rgba(75,192,192,0.4)',
        borderColor: 'rgba(75,192,192,1)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Time-Series Data',
      },
    },
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center">
        Visual Data Historian
      </Typography>
      
      <Grid container spacing={4}>
        <Grid xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2, height: '100%', overflowY: 'auto' }}>
            <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
              Connected Data Sources
            </Typography>
            {loading ? (
              <CircularProgress />
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : (
              <List>
                {dataSources.map((source) => (
                  <ListItem 
                    key={source.id} 
                    divider 
                    button
                    onClick={() => handleSourceClick(source.id)}
                    selected={selectedSourceId === source.id}
                  >
                    <ListItemText
                      primary={source.name}
                      secondary={`Type: ${source.source_type} | ID: ${source.id}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
        
        <Grid xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h5" component="h2" sx={{ mb: 2, textAlign: 'center' }}>
              Data Source Map
            </Typography>
            <MapContainer 
              center={[30.0, -95.0]} 
              zoom={6} 
              scrollWheelZoom={false} 
              style={{ height: '500px', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {dataSources.map(source => (
                source.config.latitude && source.config.longitude ? (
                  <Marker 
                    key={source.id} 
                    position={[source.config.latitude, source.config.longitude]}
                  >
                    <Popup>
                      <strong>{source.name}</strong><br />
                      Type: {source.source_type}<br />
                      Config: {JSON.stringify(source.config, null, 2)}
                    </Popup>
                  </Marker>
                ) : null
              ))}
            </MapContainer>
          </Paper>
        </Grid>

        <Grid xs={12}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h5" component="h2" sx={{ mb: 2, textAlign: 'center' }}>
              Data Point Visuals
            </Typography>
            {selectedSourceId === null ? (
              <Alert severity="info">
                Select a data source from the list on the left to view its time-series data.
              </Alert>
            ) : dataPoints.length === 0 ? (
              <Alert severity="warning">
                No data points found for this source.
              </Alert>
            ) : (
              <Line data={chartData} options={chartOptions} />
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default App;