// craco.config.js
// Configuration for bundle optimization and code splitting

const path = require('path');
const webpack = require('webpack');
const CompressionPlugin = require('compression-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Enable code splitting
      webpackConfig.optimization = {
        ...webpackConfig.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Separate vendor chunks for better caching
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
            },
            // Separate chunk for Material-UI components
            mui: {
              test: /[\\/]node_modules[\\/](@mui|@emotion)[\\/]/,
              name: 'mui',
              chunks: 'all',
              priority: 20,
              reuseExistingChunk: true,
            },
            // Separate chunk for React-related libraries
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
              name: 'react',
              chunks: 'all',
              priority: 15,
              reuseExistingChunk: true,
            },
            // Separate chunk for charting libraries
            charts: {
              test: /[\\/]node_modules[\\/](chart.js|react-chartjs-2|recharts)[\\/]/,
              name: 'charts',
              chunks: 'all',
              priority: 12,
              reuseExistingChunk: true,
            },
            // Separate chunk for form libraries
            forms: {
              test: /[\\/]node_modules[\\/](react-hook-form|yup|@hookform)[\\/]/,
              name: 'forms',
              chunks: 'all',
              priority: 11,
              reuseExistingChunk: true,
            },
          },
        },
        // Optimize runtime chunk
        runtimeChunk: {
          name: 'runtime',
        },
      };

      // Add module resolution aliases for cleaner imports
      webpackConfig.resolve = {
        ...webpackConfig.resolve,
        alias: {
          ...webpackConfig.resolve.alias,
          '@components': path.resolve(__dirname, 'src/components'),
          '@services': path.resolve(__dirname, 'src/services'),
          '@hooks': path.resolve(__dirname, 'src/hooks'),
          '@types': path.resolve(__dirname, 'src/types'),
          '@utils': path.resolve(__dirname, 'src/utils'),
          '@assets': path.resolve(__dirname, 'src/assets'),
          '@contexts': path.resolve(__dirname, 'src/contexts'),
          '@constants': path.resolve(__dirname, 'src/constants'),
        },
      };

      // Add performance optimizations
      webpackConfig.performance = {
        ...webpackConfig.performance,
        maxAssetSize: 512000, // 512 KB
        maxEntrypointSize: 512000, // 512 KB
      };

      return webpackConfig;
    },
    plugins: [
      // Add compression plugin for gzip compression
      new CompressionPlugin({
        algorithm: 'gzip',
        test: /\.(js|css|html|svg)$/,
        threshold: 8192, // Only compress files larger than 8KB
        minRatio: 0.8, // Only compress if compression ratio is better than 0.8
      }),
      // Add bundle analyzer plugin for development analysis
      ...(process.env.ANALYZE === 'true' ? [new BundleAnalyzerPlugin()] : []),
    ],
  },
  // Add performance optimizations for development
  devServer: {
    // Enable gzip compression for development server
    compress: true,
    // Optimize for faster rebuilds
    hot: true,
    // Reduce info logging
    stats: 'minimal',
  },
};