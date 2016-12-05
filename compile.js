require('./app/firebase-app')(
  require('./app/compile')(process.argv[2])
);
