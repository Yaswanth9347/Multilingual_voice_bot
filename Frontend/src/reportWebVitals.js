const reportWebVitals = (onPerfEntry) => {
  if (typeof onPerfEntry === 'function') {
    import('web-vitals')
      .then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        // Array of performance metric functions
        const metrics = [getCLS, getFID, getFCP, getLCP, getTTFB];
        
        // Iterate over each metric and call it with the onPerfEntry callback
        metrics.forEach((metric) => metric(onPerfEntry));
      })
      .catch((error) => {
        console.error('Error loading web-vitals library:', error);
      });
  } else {
    console.warn('Invalid argument: onPerfEntry must be a function.');
  }
};

export default reportWebVitals;
