import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Typography, List, ListItem, ListItemText, ListItemButton, CircularProgress, Alert, Paper, Grid2 as Grid } from '@mui/material';
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
delete (L.Icon.Default.prototype as any)._getIconUrl;
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
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);

  // Effect to fetch the list of data sources
  useEffect(() => {
    const fetchDataSources = async () => {
      try {
        const response = await axios.get('http://localhost:8000/datasources/');
        setDataSources(response.data);
      } catch (err) {
        setError('Failed to fetch data sources. Make sure your backend is running at http://localhost:8000');
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
          const source = dataSources.find(s => s.id === selectedSourceId);
          setSelectedSource(source || null);
        } catch (err) {
          setError('Failed to fetch data points for the selected source.');
          console.error(err);
        }
      };
      fetchDataPoints();
    }
  }, [selectedSourceId, dataSources]);

  const handleSourceClick = (source: DataSource) => {
    setSelectedSourceId(source.id);
    setError(null); // Clear any previous errors
  };
  
  const chartData = {
    labels: dataPoints.map(dp => new Date(dp.timestamp).toLocaleString()),
    datasets: [
      {
        label: selectedSource ? `${selectedSource.name} Values` : `Values for Source ID: ${selectedSourceId}`,
        data: dataPoints.map(dp => dp.value),
        fill: false,
        backgroundColor: 'rgba(75,192,192,0.4)',
        borderColor: 'rgba(75,192,192,1)',
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Time-Series Data',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Value'
        }
      }
    }
  };

  // Filter sources that have valid coordinates for map display
  const sourcesWithCoords = dataSources.filter(source => 
    source.config && 
    typeof source.config.latitude === 'number' && 
    typeof source.config.longitude === 'number' &&
    !isNaN(source.config.latitude) &&
    !isNaN(source.config.longitude)
  );
  
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center">
        Visual Data Historian
      </Typography>
      
      <Grid container spacing={3}>
        <Grid xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2, height: '500px', overflowY: 'auto' }}>
            <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
              Connected Data Sources
            </Typography>
            {loading ? (
              <CircularProgress />
            ) : error && dataSources.length === 0 ? (
              <Alert severity="error">{error}</Alert>
            ) : dataSources.length === 0 ? (
              <Alert severity="info">No data sources found. Add some data sources to get started.</Alert>
            ) : (
              <List>
                {dataSources.map((source) => (
                  <ListItem key={source.id} disablePadding>
                    <ListItemButton
                      onClick={() => handleSourceClick(source)}
                      selected={selectedSourceId === source.id}
                      sx={{
                        borderRadius: 1,
                        mb: 1,
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'primary.light',
                          color: 'primary.contrastText',
                          '&:hover': {
                            backgroundColor: 'primary.main',
                          },
                        },
                      }}
                    >
                      <ListItemText
                        primary={source.name}
                        secondary={`Type: ${source.source_type} | ID: ${source.id}`}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
        
        <Grid xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 2, height: '500px' }}>
            <Typography variant="h5" component="h2" sx={{ mb: 2, textAlign: 'center' }}>
              Data Source Map
            </Typography>
            {sourcesWithCoords.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                No data sources with valid coordinates found. Add latitude and longitude to your data source config to see them on the map.
              </Alert>
            ) : (
              <MapContainer 
                center={[30.0, -95.0]} 
                zoom={6} 
                scrollWheelZoom={true} 
                style={{ height: '400px', width: '100%', borderRadius: '8px' }}
              >
                <TileLayer
                  attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {sourcesWithCoords.map(source => (
                  <Marker 
                    key={source.id} 
                    position={[source.config.latitude, source.config.longitude]}
                  >
                    <Popup>
                      <div>
                        <strong>{source.name}</strong><br />
                        <strong>Type:</strong> {source.source_type}<br />
                        <strong>ID:</strong> {source.id}<br />
                        <strong>Coordinates:</strong> [{source.config.latitude}, {source.config.longitude}]
                        {Object.keys(source.config).length > 2 && (
                          <>
                            <br />
                            <strong>Config:</strong>
                            <pre style={{ fontSize: '10px', marginTop: '4px' }}>
                              {JSON.stringify(
                                Object.fromEntries(
                                  Object.entries(source.config).filter(
                                    ([key]) => !['latitude', 'longitude'].includes(key)
                                  )
                                ), 
                                null, 
                                2
                              )}
                            </pre>
                          </>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </Paper>
        </Grid>

        <Grid xs={12}>
          <Paper elevation={3} sx={{ p: 2, minHeight: '400px' }}>
            <Typography variant="h5" component="h2" sx={{ mb: 2, textAlign: 'center' }}>
              Time-Series Data Visualization
            </Typography>
            {selectedSourceId === null ? (
              <Alert severity="info">
                Select a data source from the list on the left to view its time-series data.
              </Alert>
            ) : dataPoints.length === 0 ? (
              <Alert severity="warning">
                No data points found for the selected source "{selectedSource?.name}".
              </Alert>
            ) : (
              <div style={{ height: '300px', marginTop: '16px' }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default App;