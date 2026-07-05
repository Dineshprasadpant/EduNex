import express from 'express';
import listEndpoints from 'express-list-endpoints';
import app from './app.js';

console.log(JSON.stringify(listEndpoints(app), null, 2));