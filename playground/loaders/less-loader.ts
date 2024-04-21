import type { LoaderCallback, LoaderMeta } from '../../src';

declare global {
  interface Window {
    less: {
      render: (
        content: string,
        options: { filename: string },
        cb: (err: Error, result: { css: string }) => void,
      ) => void;
    };
  }
}

const LessLoader = (content: string, meta: LoaderMeta, callback: LoaderCallback) => {
  window.less.render(
    content,
    { filename: meta.filename },
    (err: Error, result: { css: string }) => {
      if (err) {
        callback(err, '', meta);
      } else {
        callback(null, result.css, meta);
      }
    },
  );
};

export default LessLoader;
