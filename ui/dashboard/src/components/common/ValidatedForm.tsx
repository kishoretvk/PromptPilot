import React from 'react';
import { 
  useForm, 
  Controller, 
  UseFormProps, 
  FieldValues, 
  Path,
  UseFormReturn,
  DefaultValues
} from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  TextField,
  Select,
  FormControl,
  InputLabel,
  MenuItem,
  FormHelperText,
  Chip,
  Box,
  Autocomplete,
  Switch,
  FormControlLabel,
  Slider,
  Typography,
  Alert,
} from '@mui/material';

// Generic form props interface
interface ValidatedFormProps<T extends FieldValues> {
  validationSchema: yup.ObjectSchema<any>;
  onSubmit: (data: T) => void | Promise<void>;
  defaultValues?: DefaultValues<T>;
  children: (methods: UseFormReturn<T>) => React.ReactNode;
  formProps?: UseFormProps<T>;
}

// HOC for validated forms
export function ValidatedForm<T extends FieldValues>({
  validationSchema,
  onSubmit,
  defaultValues,
  children,
  formProps,
}: ValidatedFormProps<T>) {
  const methods = useForm<T>({
    resolver: yupResolver(validationSchema),
    defaultValues: defaultValues as DefaultValues<T>,
    mode: 'onBlur',
    reValidateMode: 'onChange',
    ...formProps,
  });

  const { handleSubmit } = methods;

  const submitHandler = (data: T) => {
    return onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)} noValidate>
      {children(methods)}
    </form>
  );
}

// Validated TextField Component
interface ValidatedTextFieldProps<T extends FieldValues> {
  name: Path<T>;
  control: any;
  label: string;
  multiline?: boolean;
  rows?: number;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  helperText?: string;
}

export function ValidatedTextField<T extends FieldValues>({
  name,
  control,
  label,
  multiline = false,
  rows = 1,
  type = 'text',
  placeholder,
  disabled = false,
  required = false,
  fullWidth = true,
  helperText,
}: ValidatedTextFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          label={label}
          type={type}
          multiline={multiline}
          rows={multiline ? rows : undefined}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          fullWidth={fullWidth}
          error={!!error}
          helperText={error?.message || helperText}
          variant="outlined"
          margin="normal"
        />
      )}
    />
  );
}

// Validated Select Component
interface ValidatedSelectProps<T extends FieldValues> {
  name: Path<T>;
  control: any;
  label: string;
  options: Array<{ value: string | number; label: string }>;
  disabled?: boolean;
  required?: boolean;
  fullWidth?: boolean;
}

export function ValidatedSelect<T extends FieldValues>({
  name,
  control,
  label,
  options,
  disabled = false,
  required = false,
  fullWidth = true,
}: ValidatedSelectProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormControl fullWidth={fullWidth} error={!!error} margin="normal">
          <InputLabel required={required}>{label}</InputLabel>
          <Select
            {...field}
            label={label}
            disabled={disabled}
          >
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {error && <FormHelperText>{error.message}</FormHelperText>}
        </FormControl>
      )}
    />
  );
}

// Validated Tags Input Component
interface ValidatedTagsInputProps<T extends FieldValues> {
  name: Path<T>;
  control: any;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  suggestions?: string[];
}

export function ValidatedTagsInput<T extends FieldValues>({
  name,
  control,
  label,
  placeholder = 'Add tags...',
  disabled = false,
  required = false,
  suggestions = [],
}: ValidatedTagsInputProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { value, onChange }, fieldState: { error } }) => (
        <Box sx={{ mt: 2, mb: 1 }}>
          <Autocomplete
            multiple
            freeSolo
            options={suggestions}
            value={value || []}
            onChange={(_, newValue) => onChange(newValue)}
            renderTags={(tagValue, getTagProps) =>
              tagValue.map((option, index) => {
                const { key, ...otherProps } = getTagProps({ index });
                return (
                  <Chip
                    key={key}
                    variant="outlined"
                    label={option}
                    {...otherProps}
                  />
                );
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                label={label}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
                error={!!error}
                helperText={error?.message}
                fullWidth
              />
            )}
          />
        </Box>
      )}
    />
  );
}

// Validated Switch Component
interface ValidatedSwitchProps<T extends FieldValues> {
  name: Path<T>;
  control: any;
  label: string;
  disabled?: boolean;
  helperText?: string;
}

export function ValidatedSwitch<T extends FieldValues>({
  name,
  control,
  label,
  disabled = false,
  helperText,
}: ValidatedSwitchProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { value, onChange }, fieldState: { error } }) => (
        <Box sx={{ mt: 2, mb: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={!!value}
                onChange={onChange}
                disabled={disabled}
              />
            }
            label={label}
          />
          {helperText && (
            <Typography variant="caption" color="text.secondary" display="block">
              {helperText}
            </Typography>
          )}
          {error && (
            <Typography variant="caption" color="error" display="block">
              {error.message}
            </Typography>
          )}
        </Box>
      )}
    />
  );
}

// Validated Slider Component
interface ValidatedSliderProps<T extends FieldValues> {
  name: Path<T>;
  control: any;
  label: string;
  min: number;
  max: number;
  step?: number;
  marks?: Array<{ value: number; label: string }>;
  disabled?: boolean;
  valueLabelDisplay?: 'auto' | 'on' | 'off';
}

export function ValidatedSlider<T extends FieldValues>({
  name,
  control,
  label,
  min,
  max,
  step = 1,
  marks,
  disabled = false,
  valueLabelDisplay = 'auto',
}: ValidatedSliderProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { value, onChange }, fieldState: { error } }) => (
        <Box sx={{ mt: 3, mb: 2, px: 1 }}>
          <Typography gutterBottom>
            {label}
          </Typography>
          <Slider
            value={value || min}
            onChange={(_, newValue) => onChange(newValue)}
            min={min}
            max={max}
            step={step}
            marks={marks}
            disabled={disabled}
            valueLabelDisplay={valueLabelDisplay}
          />
          {error && (
            <Typography variant="caption" color="error" display="block" sx={{ mt: 1 }}>
              {error.message}
            </Typography>
          )}
        </Box>
      )}
    />
  );
}

// Form Error Display Component
interface FormErrorDisplayProps {
  errors: Record<string, any>;
  title?: string;
}

export function FormErrorDisplay({ errors, title = 'Please fix the following errors:' }: FormErrorDisplayProps) {
  const errorMessages = Object.values(errors).filter(Boolean).map(String);
  
  if (errorMessages.length === 0) return null;

  return (
    <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        {title}
      </Typography>
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        {errorMessages.map((message, index) => (
          <li key={index}>{message}</li>
        ))}
      </ul>
    </Alert>
  );
}

// Success Message Component
interface FormSuccessMessageProps {
  show: boolean;
  message?: string;
}

export function FormSuccessMessage({ 
  show, 
  message = 'Form submitted successfully!' 
}: FormSuccessMessageProps) {
  if (!show) return null;

  return (
    <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
      {message}
    </Alert>
  );
}

// Field Array Component for dynamic lists
interface ValidatedFieldArrayProps<T extends FieldValues> {
  name: Path<T>;
  control: any;
  label: string;
  addButtonText?: string;
  renderField: (index: number, remove: (index: number) => void) => React.ReactNode;
  maxItems?: number;
}

export function ValidatedFieldArray<T extends FieldValues>({
  name,
  control,
  label,
  addButtonText = 'Add Item',
  renderField,
  maxItems = 10,
}: ValidatedFieldArrayProps<T>) {
  const [items, setItems] = React.useState<number[]>([0]);

  const addItem = () => {
    if (items.length < maxItems) {
      setItems(prev => [...prev, Math.max(...prev) + 1]);
    }
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        {label}
      </Typography>
      {items.map((item, index) => (
        <Box key={item} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
          {renderField(index, () => removeItem(index))}
        </Box>
      ))}
      <Box sx={{ mt: 2 }}>
        <Typography
          variant="body2"
          color="primary"
          sx={{ cursor: 'pointer', textDecoration: 'underline' }}
          onClick={addItem}
        >
          + {addButtonText}
        </Typography>
      </Box>
    </Box>
  );
}

// JSON Editor Component with validation
interface ValidatedJSONEditorProps<T extends FieldValues> {
  name: Path<T>;
  control: any;
  label: string;
  disabled?: boolean;
  required?: boolean;
}

export function ValidatedJSONEditor<T extends FieldValues>({
  name,
  control,
  label,
  disabled = false,
  required = false,
}: ValidatedJSONEditorProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { value, onChange }, fieldState: { error } }) => {
        const [jsonString, setJsonString] = React.useState(
          value ? JSON.stringify(value, null, 2) : ''
        );
        const [jsonError, setJsonError] = React.useState<string>('');

        const handleChange = (newValue: string) => {
          setJsonString(newValue);
          try {
            const parsed = JSON.parse(newValue);
            onChange(parsed);
            setJsonError('');
          } catch (err) {
            setJsonError('Invalid JSON format');
          }
        };

        return (
          <Box sx={{ mt: 2, mb: 1 }}>
            <TextField
              label={label}
              multiline
              rows={6}
              value={jsonString}
              onChange={(e) => handleChange(e.target.value)}
              disabled={disabled}
              required={required}
              fullWidth
              error={!!(error || jsonError)}
              helperText={error?.message || jsonError}
              placeholder="Enter valid JSON configuration"
              variant="outlined"
              sx={{ fontFamily: 'monospace' }}
            />
          </Box>
        );
      }}
    />
  );
}

// Password strength indicator
interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const getStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[@$!%*?&]/.test(pwd)) score++;
    
    return score;
  };

  const strength = getStrength(password);
  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['#f44336', '#ff9800', '#ffc107', '#4caf50', '#2e7d32'];

  if (!password) return null;

  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="caption" sx={{ color: colors[strength - 1] }}>
        Password Strength: {labels[strength - 1] || 'Very Weak'}
      </Typography>
      <Box sx={{ width: '100%', height: 4, bgcolor: 'grey.300', borderRadius: 2, mt: 0.5 }}>
        <Box
          sx={{
            width: `${(strength / 5) * 100}%`,
            height: '100%',
            bgcolor: colors[strength - 1] || colors[0],
            borderRadius: 2,
            transition: 'all 0.3s ease',
          }}
        />
      </Box>
    </Box>
  );
}