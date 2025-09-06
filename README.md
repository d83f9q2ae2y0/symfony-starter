Symfony + React + Webpack Encore Setup Guide
Prerequisites
Before starting, ensure you have the following installed:

PHP 8.1 or higher
Composer
Node.js (v14 or higher)
npm or yarn

Step 1: Create a New Symfony Project
# Create a new Symfony project
composer create-project symfony/skeleton my-symfony-react-app

# Navigate to the project directory
cd my-symfony-react-app

# Install additional Symfony components
composer require webapp
Step 2: Install Webpack Encore
# Install Webpack Encore bundle
composer require symfony/webpack-encore-bundle

# Install Node.js dependencies
npm install
Step 3: Install React Dependencies
# Install React and React DOM
npm install react react-dom

# Install React preset for Babel
npm install --save-dev @babel/preset-react

Step 4: Configure Webpack Encore for React
Edit the webpack.config.js file in your project root:
const Encore = require('@symfony/webpack-encore');

// Manually configure the runtime environment if not already configured yet by the "encore" command.
// It's useful when you use tools that rely on webpack.config.js file.
if (!Encore.isRuntimeEnvironmentConfigured()) {
    Encore.configureRuntimeEnvironment(process.env.NODE_ENV || 'dev');
}

Encore
    // directory where compiled assets will be stored
    .setOutputPath('public/build/')
    // public path used by the web server to access the output path
    .setPublicPath('/build')
    
    // only needed for CDN's or subdirectory deploy
    //.setManifestKeyPrefix('build/')

    /*
     * ENTRY CONFIG
     *
     * Each entry will result in one JavaScript file (e.g. app.js)
     * and one CSS file (e.g. app.css) if your JavaScript imports CSS.
     */
    .addEntry('app', './assets/app.js')

    // enables the Symfony UX Stimulus bridge (used with @symfony/stimulus-bridge)
    .enableStimulusBridge('./assets/controllers.json')

    // When enabled, Webpack "splits" your files into smaller pieces for greater optimization.
    .splitEntryChunks()

    // will require an extra script tag for runtime.js
    // but, you probably want this, unless you're building a single-page app
    .enableSingleRuntimeChunk()

    /*
     * FEATURE CONFIG
     *
     * Enable & configure other features below. For a full
     * list of features, see:
     * https://symfony.com/doc/current/frontend.html#adding-more-features
     */
    .cleanupOutputBeforeBuild()
    .enableBuildNotifications()
    .enableSourceMaps(!Encore.isProduction())
    // enables hashed filenames (e.g. app.abc123.css)
    .enableVersioning(Encore.isProduction())

    .configureBabel((config) => {
        config.plugins.push('@babel/plugin-proposal-class-properties');
    })

    // enables @babel/preset-env polyfills
    .configureBabelPresetEnv((config) => {
        config.useBuiltIns = 'usage';
        config.corejs = 3;
    })

    // Enable React preset
    .enableReactPreset()

    // uncomment if you use TypeScript
    //.enableTypeScriptLoader()

    // uncomment if you use Sass/SCSS files
    .enableSassLoader()

    // uncomment if you're having problems with a jQuery plugin
    //.autoProvidejQuery()
;

module.exports = Encore.getWebpackConfig();

Step 5: Create React Components
Create a directory structure for your React components:

mkdir -p assets/js/components

Create your first React component in assets/js/components/App.jsx:

import React from 'react';

const App = () => {
    return (
        <div>
            <h1>Hello from React!</h1>
            <p>This is a Symfony app with React and Webpack Encore.</p>
        </div>
    );
};

export default App;

Step 6: Update the Main JavaScript Entry Point
Edit assets/app.js to include React:

import './styles/app.css';

// Import React
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './js/components/App';

// Start the Stimulus application
import './bootstrap';

// Render React app
const container = document.getElementById('react-app');
if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(<App />);
}

Step 7: Create a Controller
Create a Symfony controller to serve your page:

# Generate a controller
php bin/console make:controller HomeController

<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class HomeController extends AbstractController
{
    #[Route('/', name: 'app_home')]
    public function index(): Response
    {
        return $this->render('home/index.html.twig');
    }
}

Step 8: Create the Twig Template
Create templates/home/index.html.twig:

{% extends 'base.html.twig' %}

{% block title %}Symfony + React App{% endblock %}

{% block body %}
    <div class="container">
        <div id="react-app">
            <!-- React will render here -->
        </div>
    </div>
{% endblock %}

{% block javascripts %}
    {{ encore_entry_script_tags('app') }}
{% endblock %}

{% block stylesheets %}
    {{ encore_entry_link_tags('app') }}
{% endblock %}

Step 9: Update Base Template
Make sure your templates/base.html.twig includes the Encore functions:

<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <title>{% block title %}Welcome!{% endblock %}</title>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 128 128%22><text y=%221.2em%22 font-size=%2296%22>⚫️</text></svg>">
        {# Run `composer require symfony/webpack-encore-bundle` to start using Symfony UX #}
        {% block stylesheets %}
            {{ encore_entry_link_tags('app') }}
        {% endblock %}

        {% block javascripts %}
            {{ encore_entry_script_tags('app') }}
        {% endblock %}
    </head>
    <body>
        {% block body %}{% endblock %}
    </body>
</html>

Step 10: Build Assets and Start Development

# Build assets for development
npm run dev

# Or build and watch for changes
npm run watch

# Start the Symfony development server
php -S localhost:8000 -t public/

# Or if you have Symfony CLI installed
symfony server:start
