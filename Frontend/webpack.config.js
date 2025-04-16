module.exports = {
    // ...other configuration settings...
    module: {
      rules: [
        {
          test: /\.css$/, // Applies this rule to any file that ends with .css
          use: [
            "style-loader",   // Injects CSS into the DOM
            "css-loader",     // Resolves @import and url() within CSS files
            "postcss-loader", // Processes your CSS with PostCSS, which will pick up tailwind.config.js automatically from the project root
          ],
        },
      ],
    },
  };
  