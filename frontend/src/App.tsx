import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Typography, List, ListItem, ListItemText, ListItemButton, CircularProgress, Alert, Paper, Box } from '@mui/material';
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
  const [loading, setLoading] = useState(true);
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
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center">
        Visual Data Historian
      </Typography>

      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        gap: 3 
      }}>
        {/* Left Panel - Data Sources */}
        <Box sx={{ 
          flex: { md: '0 0 33%' },
          width: { xs: '100%', md: 'auto' }
        }}>
          <Paper elevation={3} sx={{ p: 2, height: 'fit-content' }}>
            <Typography variant="h5" gutterBottom>
              Connected Data Sources
            </Typography>
            {loading ? (
              <CircularProgress />
            ) : error && dataSources.length === 0 ? (
              <Alert severity="error">{error}</Alert>
            ) : dataSources.length === 0 ? (
              <Typography>
                No data sources found. Add some data sources to get started.
              </Typography>
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
        </Box>

        {/* Right Panel - Map and Chart */}
        <Box sx={{ 
          flex: { md: '1 1 67%' },
          width: { xs: '100%', md: 'auto' },
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}>
          {/* Map Section */}
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom>
              Data Source Map
            </Typography>
            {sourcesWithCoords.length === 0 ? (
              <Typography>
                No data sources with valid coordinates found. Add latitude and longitude to your data source config to see them on the map.
              </Typography>
            ) : (
              <MapContainer
                center={[sourcesWithCoords[0].config.latitude, sourcesWithCoords[0].config.longitude]}
                zoom={10}
                style={{ height: '400px', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {sourcesWithCoords.map(source => (
                  <Marker
                    key={source.id}
                    position={[source.config.latitude, source.config.longitude]}
                  >
                    <Popup>
                      <div>
                        <strong>{source.name}</strong><br />
                        Type: {source.source_type}<br />
                        ID: {source.id}<br />
                        Coordinates: [{source.config.latitude}, {source.config.longitude}]
                        {Object.keys(source.config).length > 2 && (
                          <>
                            <br />Config:<br />
                            <pre>
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

          {/* Chart Section */}
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom>
              Time-Series Data Visualization
            </Typography>
            {selectedSourceId === null ? (
              <Typography>
                Select a data source from the list on the left to view its time-series data.
              </Typography>
            ) : dataPoints.length === 0 ? (
              <Typography>
                No data points found for the selected source "{selectedSource?.name}".
              </Typography>
            ) : (
              <Box sx={{ height: '400px' }}>
                <Line data={chartData} options={chartOptions} />
              </Box>
            )}
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};

export default App;
