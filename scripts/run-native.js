const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {loadEnvironment, parseArguments} = require('./check-environment');

function readSelectionOption(args, name) {
  const values = [];
  args.forEach((arg, index) => {
    if (arg === name) {
      values.push(args[index + 1]);
    } else if (arg.startsWith(name + '=')) {
      values.push(arg.slice(name.length + 1));
    }
  });
  if (values.length > 1) {
    throw new Error(
      'Do not override ' +
        name +
        ' in an environment script. Use the matching environment command.',
    );
  }
  return values[0];
}

function validateNativeSelection(args, {filename, environment}, options) {
  const mode = readSelectionOption(args, '--mode');
  readSelectionOption(args, '--scheme');
  if (
    args.some(arg =>
      ['--interactive', '-i', '--binary-path'].includes(arg.split('=')[0]),
    )
  ) {
    throw new Error(
      'Environment scripts build the selected configuration. Use --device or --simulator instead of interactive selection or prebuilt binaries.',
    );
  }
  if (!['run-ios', 'build-ios'].includes(args[0])) {
    return;
  }
  const extraParams = readSelectionOption(args, '--extra-params') || '';
  if (
    args.some(arg => arg === '--xcconfig' || arg.startsWith('--xcconfig=')) ||
    /(?:^|\s)(?:-configuration|-scheme|-xcconfig|(?:ENVFILE|EXPECTED_APP_ENV|ENVIRONMENT_RELEASE_BUILD|CONFIGURATION)=)/.test(
      extraParams,
    )
  ) {
    throw new Error(
      'Do not override iOS environment settings through xcconfig or extra build parameters.',
    );
  }
  // Xcode/CocoaPods use fixed configuration mappings, not shell ENVFILE.
  const configurations = {
    Debug: {env: 'dev', release: false},
    'Debug-UAT': {env: 'uat', release: false},
    'Release-UAT': {env: 'uat', release: true},
    Release: {env: 'prod', release: true},
  };
  const selection = configurations[mode || 'Debug'];
  if (
    !selection ||
    selection.env !== environment.env ||
    selection.release !== options.release
  ) {
    throw new Error(
      'The iOS build configuration must match the selected environment and release mode.',
    );
  }
  const nativeFile = path.resolve(__dirname, '..', '.env.' + selection.env);
  if (filename !== nativeFile) {
    throw new Error(
      'iOS configurations use ' +
        nativeFile +
        '. Update the Xcode/Podfile mapping to use a custom environment file.',
    );
  }
}

function runNative(args, runCommand = spawnSync) {
  const separator = args.indexOf('--');
  if (separator < 0 || separator === args.length - 1) {
    throw new Error(
      'Usage: run-native.js [environment options] -- <React Native CLI command>',
    );
  }
  const options = parseArguments(args.slice(0, separator));
  const loaded = loadEnvironment(options);
  const cliArgs = args.slice(separator + 1);
  validateNativeSelection(cliArgs, loaded, options);
  console.log(
    'Building ' + loaded.environment.env + ' with ' + loaded.filename,
  );
  // RN exports its package manifest but does not export the CLI subpath.
  const cliPath = path.join(
    path.dirname(require.resolve('react-native/package.json')),
    'cli.js',
  );
  // Invoke Node directly so Windows and Unix receive the same CLI arguments.
  const result = runCommand(process.execPath, [cliPath, ...cliArgs], {
    stdio: 'inherit',
    env: {...process.env, ENVFILE: loaded.filename},
  });
  if (result.error) {
    throw result.error;
  }
  if (result.signal) {
    throw new Error(
      'React Native CLI stopped with signal ' + result.signal + '.',
    );
  }
  return result.status ?? 1;
}

if (require.main === module) {
  try {
    process.exitCode = runNative(process.argv.slice(2));
  } catch (error) {
    console.error('[environment] ' + error.message);
    process.exitCode = 1;
  }
}

module.exports = {runNative};
