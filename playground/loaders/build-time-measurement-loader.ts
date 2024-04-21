import type { LoaderMeta } from '../../src';

const metaKey = Symbol('buildTimeMeasurementLoaderMetaKey');

interface ExtendedLoaderMeta extends LoaderMeta {
  [metaKey]: {
    startTime: number;
    contentLength: number;
  };
}

const BuildTimeMeasurementLoader = (_: string, meta: ExtendedLoaderMeta) => {
  const endTime = Date.now();
  const { startTime, contentLength } = meta[metaKey];
  // eslint-disable-next-line no-console
  console.log(`LessLoader: transform ${meta.filename} (${contentLength} chars) cost ${endTime - startTime}ms`);
};

BuildTimeMeasurementLoader.pitch = (content: string, meta: ExtendedLoaderMeta) => {
  if (!meta[metaKey]) {
    meta[metaKey] = {
      startTime: Date.now(),
      contentLength: content.length,
    };
  }
};

export default BuildTimeMeasurementLoader;
