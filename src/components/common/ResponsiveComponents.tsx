import React from 'react';
import { 
  useTheme, 
  useMediaQuery, 
  Box, 
  Container, 
  Grid, 
  Stack,
  Typography,
  IconButton,
  Drawer,
  AppBar,
  Toolbar,
} from '@mui/material';
import { Breakpoint } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

// Custom hook for responsive breakpoints
export const useResponsive = () => {
  const theme = useTheme();
  
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const isLargeDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const isExtraLarge = useMediaQuery(theme.breakpoints.up('xl'));
  
  // Get current breakpoint
  const getCurrentBreakpoint = (): Breakpoint => {
    if (useMediaQuery(theme.breakpoints.up('xl'))) return 'xl';
    if (useMediaQuery(theme.breakpoints.up('lg'))) return 'lg';
    if (useMediaQuery(theme.breakpoints.up('md'))) return 'md';
    if (useMediaQuery(theme.breakpoints.up('sm'))) return 'sm';
    return 'xs';
  };

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    isExtraLarge,
    currentBreakpoint: getCurrentBreakpoint(),
    // Utility functions
    only: (breakpoint: Breakpoint) => useMediaQuery(theme.breakpoints.only(breakpoint)),
    up: (breakpoint: Breakpoint) => useMediaQuery(theme.breakpoints.up(breakpoint)),
    down: (breakpoint: Breakpoint) => useMediaQuery(theme.breakpoints.down(breakpoint)),
    between: (start: Breakpoint, end: Breakpoint) => 
      useMediaQuery(theme.breakpoints.between(start, end)),
  };
};

// Responsive container component
interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: Breakpoint | false;
  disableGutters?: boolean;
  sx?: any;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = 'lg',
  disableGutters = false,
  sx,
}) => {
  const { isMobile } = useResponsive();
  
  return (
    <Container
      maxWidth={maxWidth}
      disableGutters={disableGutters || isMobile}
      sx={{
        px: isMobile ? 2 : 3,
        py: isMobile ? 2 : 3,
        ...sx,
      }}
    >
      {children}
    </Container>
  );
};

// Responsive grid component
interface ResponsiveGridProps {
  children: React.ReactNode;
  spacing?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  container?: boolean;
  item?: boolean;
  xs?: number | 'auto';
  sm?: number | 'auto';
  md?: number | 'auto';
  lg?: number | 'auto';
  xl?: number | 'auto';
  sx?: any;
  component?: React.ElementType;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  spacing = 2,
  container = false,
  item = false,
  xs,
  sm,
  md,
  lg,
  xl,
  sx,
  component = 'div',
}) => {
  const { isMobile } = useResponsive();
  
  const responsiveSpacing = typeof spacing === 'object' 
    ? spacing 
    : { xs: isMobile ? 1 : spacing, sm: spacing, md: spacing, lg: spacing, xl: spacing };

  // For container grids
  if (container) {
    const containerProps: any = {
      container: true,
      spacing: responsiveSpacing,
      sx,
      component,
    };
    
    return (
      <Grid {...containerProps}>
        {children}
      </Grid>
    );
  }
  
  // For item grids (use the item prop and breakpoint props)
  // Fix: In MUI v7, we need to properly handle the props for item grids
  const itemProps: any = {
    item: true,
    sx,
    component,
  };
  
  // Only add breakpoint props if they are defined
  if (xs !== undefined) itemProps.xs = xs;
  if (sm !== undefined) itemProps.sm = sm;
  if (md !== undefined) itemProps.md = md;
  if (lg !== undefined) itemProps.lg = lg;
  if (xl !== undefined) itemProps.xl = xl;
  
  return (
    <Grid {...itemProps}>
      {children}
    </Grid>
  );
};

// Responsive stack component
interface ResponsiveStackProps {
  children: React.ReactNode;
  direction?: 'row' | 'column' | { xs?: 'row' | 'column'; sm?: 'row' | 'column'; md?: 'row' | 'column' };
  spacing?: number | { xs?: number; sm?: number; md?: number };
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  sx?: any;
}

export const ResponsiveStack: React.FC<ResponsiveStackProps> = ({
  children,
  direction = { xs: 'column', sm: 'row' },
  spacing = { xs: 1, sm: 2 },
  alignItems = 'center',
  justifyContent = 'flex-start',
  sx,
}) => {
  return (
    <Stack
      direction={direction}
      spacing={spacing}
      alignItems={alignItems}
      justifyContent={justifyContent}
      sx={sx}
    >
      {children}
    </Stack>
  );
};

// Mobile-first typography component
interface ResponsiveTypographyProps {
  children: React.ReactNode;
  variant?: {
    xs?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'subtitle1' | 'subtitle2' | 'body1' | 'body2' | 'caption';
    sm?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'subtitle1' | 'subtitle2' | 'body1' | 'body2' | 'caption';
    md?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'subtitle1' | 'subtitle2' | 'body1' | 'body2' | 'caption';
  };
  component?: React.ElementType;
  sx?: any;
}

export const ResponsiveTypography: React.FC<ResponsiveTypographyProps> = ({
  children,
  variant = { xs: 'body1', sm: 'body1', md: 'body1' },
  component,
  sx,
}) => {
  const theme = useTheme();
  
  return (
    <Typography
      variant="body1"
      {...(component ? { component } : {})}
      sx={{
        [theme.breakpoints.up('xs')]: {
          ...theme.typography[variant.xs || 'body1'],
        },
        [theme.breakpoints.up('sm')]: {
          ...theme.typography[variant.sm || variant.xs || 'body1'],
        },
        [theme.breakpoints.up('md')]: {
          ...theme.typography[variant.md || variant.sm || variant.xs || 'body1'],
        },
        ...sx,
      }}
    >
      {children}
    </Typography>
  );
};

// Responsive drawer navigation
interface ResponsiveDrawerProps {
  children: React.ReactNode;
  open?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  drawerWidth?: number;
  title?: string;
  permanent?: boolean;
}

export const ResponsiveDrawer: React.FC<ResponsiveDrawerProps> = ({
  children,
  open = false,
  onClose,
  onOpen,
  drawerWidth = 280,
  title,
  permanent = false,
}) => {
  const { isMobile } = useResponsive();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else if (onOpen && onClose) {
      open ? onClose() : onOpen();
    }
  };

  const drawer = (
    <Box>
      {title && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" noWrap>
            {title}
          </Typography>
        </Box>
      )}
      {children}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Mobile App Bar */}
      {isMobile && (
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap>
              {title}
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
              },
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
              <IconButton onClick={handleDrawerToggle}>
                <CloseIcon />
              </IconButton>
            </Box>
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant={permanent ? "permanent" : "persistent"}
            open={open}
            sx={{
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
              },
            }}
          >
            {drawer}
          </Drawer>
        )}
      </Box>
    </Box>
  );
};

// Responsive card grid
interface ResponsiveCardGridProps {
  children: React.ReactNode;
  minCardWidth?: number;
  spacing?: number;
  sx?: any;
}

export const ResponsiveCardGrid: React.FC<ResponsiveCardGridProps> = ({
  children,
  minCardWidth = 300,
  spacing = 2,
  sx,
}) => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}px, 1fr))`,
        gap: spacing,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

// Responsive table wrapper
interface ResponsiveTableProps {
  children: React.ReactNode;
  maxHeight?: number;
  stickyHeader?: boolean;
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  children,
  maxHeight = 400,
  stickyHeader = true,
}) => {
  const { isMobile } = useResponsive();

  return (
    <Box
      sx={{
        width: '100%',
        overflow: 'auto',
        maxHeight: isMobile ? '70vh' : maxHeight,
      }}
    >
      <Box sx={{ minWidth: isMobile ? 600 : 'auto' }}>
        {children}
      </Box>
    </Box>
  );
};

// Hide/Show component based on breakpoints
interface ResponsiveDisplayProps {
  children: React.ReactNode;
  hideOn?: Breakpoint[];
  showOn?: Breakpoint[];
}

export const ResponsiveDisplay: React.FC<ResponsiveDisplayProps> = ({
  children,
  hideOn = [],
  showOn = [],
}) => {
  const { currentBreakpoint } = useResponsive();
  
  const shouldHide = hideOn.includes(currentBreakpoint);
  const shouldShow = showOn.length === 0 || showOn.includes(currentBreakpoint);
  
  if (shouldHide || !shouldShow) {
    return null;
  }
  
  return <>{children}</>;
};

// Responsive image component
interface ResponsiveImageProps {
  src: string;
  alt: string;
  aspectRatio?: number; // width / height
  maxWidth?: string | number;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  sx?: any;
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  aspectRatio = 16 / 9,
  maxWidth = '100%',
  objectFit = 'cover',
  sx,
}) => {
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth,
        aspectRatio,
        overflow: 'hidden',
        '& img': {
          width: '100%',
          height: '100%',
          objectFit,
        },
        ...sx,
      }}
    >
      <img src={src} alt={alt} loading="lazy" />
    </Box>
  );
};

// Responsive spacing utility
export const getResponsiveSpacing = (theme: any, mobile: number, desktop: number) => ({
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(mobile),
    margin: theme.spacing(mobile),
  },
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(desktop),
    margin: theme.spacing(desktop),
  },
});

// Responsive font size utility
export const getResponsiveFontSize = (mobile: string, desktop: string) => ({
  fontSize: {
    xs: mobile,
    md: desktop,
  },
});

// Common responsive breakpoint values
export const RESPONSIVE_BREAKPOINTS = {
  mobile: 'xs',
  tablet: 'sm',
  desktop: 'md',
  largeDesktop: 'lg',
  extraLarge: 'xl',
} as const;

// Common responsive grid configurations
export const RESPONSIVE_GRID_CONFIGS = {
  // 1 column on mobile, 2 on tablet, 3 on desktop
  oneToThree: { xs: 12, sm: 6, md: 4 },
  // 1 column on mobile, 2 on desktop
  oneToTwo: { xs: 12, md: 6 },
  // 2 columns on mobile, 3 on tablet, 4 on desktop
  twoToFour: { xs: 6, sm: 4, md: 3 },
  // Full width on mobile, half on desktop
  fullToHalf: { xs: 12, md: 6 },
  // Common sidebar layout
  sidebar: { xs: 12, md: 3 },
  content: { xs: 12, md: 9 },
} as const;