import React, { useState, useCallback } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Slider,
  Alert,
  Divider,
  Paper,
  Avatar,
  Chip,
  useTheme,
} from '@mui/material';
import {
  Palette as PaletteIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  SettingsBrightness as AutoModeIcon,
  FormatSize as FontSizeIcon,
  ViewCompact as CompactIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import {
  useThemeSettings,
  useUpdateThemeSettings,
} from '../../hooks/useSettings';
import { ThemeSettings as ThemeSettingsType } from '../../types/Settings';

interface ThemeFormData {
  mode: 'light' | 'dark' | 'auto';
  primary_color: string;
  secondary_color: string;
  font_family: string;
  font_size: 'small' | 'medium' | 'large';
  compact_mode: boolean;
}

const colorOptions = [
  { name: 'Blue', value: '#1976d2', light: '#42a5f5', dark: '#1565c0' },
  { name: 'Purple', value: '#7b1fa2', light: '#ab47bc', dark: '#6a1b9a' },
  { name: 'Green', value: '#388e3c', light: '#66bb6a', dark: '#2e7d32' },
  { name: 'Orange', value: '#f57c00', light: '#ffb74d', dark: '#ef6c00' },
  { name: 'Red', value: '#d32f2f', light: '#f44336', dark: '#c62828' },
  { name: 'Teal', value: '#00796b', light: '#26a69a', dark: '#00695c' },
];

const fontOptions = [
  { name: 'Roboto', value: 'Roboto, sans-serif' },
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Open Sans', value: 'Open Sans, sans-serif' },
  { name: 'Lato', value: 'Lato, sans-serif' },
  { name: 'Montserrat', value: 'Montserrat, sans-serif' },
];

const ThemeSettings: React.FC = () => {
  const theme = useTheme();
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light');
  
  const { data: themeSettings, isLoading } = useThemeSettings();
  const updateMutation = useUpdateThemeSettings();
  
  const { control, handleSubmit, watch, setValue } = useForm<ThemeFormData>({
    defaultValues: {
      mode: themeSettings?.mode || 'light',
      primary_color: themeSettings?.primary_color || '#1976d2',
      secondary_color: themeSettings?.secondary_color || '#dc004e',
      font_family: themeSettings?.font_family || 'Roboto, sans-serif',
      font_size: themeSettings?.font_size || 'medium',
      compact_mode: themeSettings?.compact_mode || false,
    },
  });

  const watchedValues = watch();

  const handleSave = useCallback((data: ThemeFormData) => {
    updateMutation.mutate(data);
  }, [updateMutation]);

  const handleReset = useCallback(() => {
    const defaultSettings: ThemeFormData = {
      mode: 'light',
      primary_color: '#1976d2',
      secondary_color: '#dc004e',
      font_family: 'Roboto, sans-serif',
      font_size: 'medium',
      compact_mode: false,
    };
    
    Object.entries(defaultSettings).forEach(([key, value]) => {
      setValue(key as keyof ThemeFormData, value);
    });
  }, [setValue]);

  const handleColorSelect = useCallback((color: string, type: 'primary' | 'secondary') => {
    if (type === 'primary') {
      setValue('primary_color', color);
    } else {
      setValue('secondary_color', color);
    }
  }, [setValue]);

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'light': return <LightModeIcon />;
      case 'dark': return <DarkModeIcon />;
      case 'auto': return <AutoModeIcon />;
      default: return <LightModeIcon />;
    }
  };

  const getFontSizeLabel = (size: string) => {
    switch (size) {
      case 'small': return 'Small (14px)';
      case 'medium': return 'Medium (16px)';
      case 'large': return 'Large (18px)';
      default: return 'Medium (16px)';
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography>Loading theme settings...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Theme Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Customize the appearance and behavior of your PromptPilot interface
        </Typography>
      </Box>

      <form onSubmit={handleSubmit(handleSave)}>
        <Grid container spacing={4}>
          {/* Theme Mode */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getModeIcon(watchedValues.mode)}
                  Theme Mode
                </Typography>
                <Controller
                  name="mode"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Mode</InputLabel>
                      <Select {...field} label="Mode">
                        <MenuItem value="light">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LightModeIcon fontSize="small" />
                            Light
                          </Box>
                        </MenuItem>
                        <MenuItem value="dark">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <DarkModeIcon fontSize="small" />
                            Dark
                          </Box>
                        </MenuItem>
                        <MenuItem value="auto">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AutoModeIcon fontSize="small" />
                            Auto (System)
                          </Box>
                        </MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Choose between light, dark, or automatic theme based on system preference
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Layout Options */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CompactIcon />
                  Layout Options
                </Typography>
                <Controller
                  name="compact_mode"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Compact Mode"
                    />
                  )}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Enable compact mode for denser information display
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Primary Color */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PaletteIcon />
                  Primary Color
                </Typography>
                <Grid container spacing={2}>
                  {colorOptions.map((color) => (
                    <Grid item key={color.value}>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          cursor: 'pointer',
                          '&:hover': { opacity: 0.8 },
                        }}
                        onClick={() => handleColorSelect(color.value, 'primary')}
                      >
                        <Avatar
                          sx={{
                            bgcolor: color.value,
                            width: 48,
                            height: 48,
                            border: watchedValues.primary_color === color.value ? 3 : 0,
                            borderColor: 'primary.main',
                          }}
                        >
                          {watchedValues.primary_color === color.value && '✓'}
                        </Avatar>
                        <Typography variant="caption" sx={{ mt: 1 }}>
                          {color.name}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Secondary Color */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Secondary Color
                </Typography>
                <Grid container spacing={2}>
                  {colorOptions.map((color) => (
                    <Grid item key={color.value}>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          cursor: 'pointer',
                          '&:hover': { opacity: 0.8 },
                        }}
                        onClick={() => handleColorSelect(color.value, 'secondary')}
                      >
                        <Avatar
                          sx={{
                            bgcolor: color.value,
                            width: 48,
                            height: 48,
                            border: watchedValues.secondary_color === color.value ? 3 : 0,
                            borderColor: 'secondary.main',
                          }}
                        >
                          {watchedValues.secondary_color === color.value && '✓'}
                        </Avatar>
                        <Typography variant="caption" sx={{ mt: 1 }}>
                          {color.name}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Typography */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FontSizeIcon />
                  Typography
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Controller
                    name="font_family"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Font Family</InputLabel>
                        <Select {...field} label="Font Family">
                          {fontOptions.map((font) => (
                            <MenuItem key={font.value} value={font.value}>
                              <Typography sx={{ fontFamily: font.value }}>
                                {font.name}
                              </Typography>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Box>

                <Controller
                  name="font_size"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Font Size</InputLabel>
                      <Select {...field} label="Font Size">
                        <MenuItem value="small">{getFontSizeLabel('small')}</MenuItem>
                        <MenuItem value="medium">{getFontSizeLabel('medium')}</MenuItem>
                        <MenuItem value="large">{getFontSizeLabel('large')}</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Preview */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Preview
                </Typography>
                <Paper
                  sx={{
                    p: 3,
                    bgcolor: watchedValues.mode === 'dark' ? 'grey.900' : 'background.paper',
                    color: watchedValues.mode === 'dark' ? 'common.white' : 'text.primary',
                    fontFamily: watchedValues.font_family,
                    fontSize: watchedValues.font_size === 'small' ? '14px' : 
                             watchedValues.font_size === 'large' ? '18px' : '16px',
                  }}
                >
                  <Typography variant="h6" sx={{ color: watchedValues.primary_color, mb: 1 }}>
                    Primary Color Text
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    This is how your text will appear with the selected settings.
                  </Typography>
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Chip 
                      label="Primary Chip" 
                      sx={{ bgcolor: watchedValues.primary_color, color: 'white' }} 
                    />
                    <Chip 
                      label="Secondary Chip" 
                      sx={{ bgcolor: watchedValues.secondary_color, color: 'white' }} 
                    />
                  </Box>
                </Paper>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={handleReset}
          >
            Reset to Default
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </form>

      {/* Status Messages */}
      {updateMutation.isSuccess && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Theme settings saved successfully!
        </Alert>
      )}
      
      {updateMutation.error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to save theme settings. Please try again.
        </Alert>
      )}
    </Box>
  );
};

export default ThemeSettings;