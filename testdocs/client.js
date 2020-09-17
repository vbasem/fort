/*
BSD 3-Clause License

Copyright (c) 2020, freeCodeCamp. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/

import '@babel/polyfill';
import jQuery from 'jquery';

window.$ = jQuery;

document.__initTestFrame = initTestFrame;

async function initTestFrame(e = { code: {} }) {
  const code = (e.code.contents || '').slice();
  const editableContents = (e.code.editableContents || '').slice();
  // __testEditable allows test authors to run tests against a transitory dom
  // element built using only the code in the editable region.
  // eslint-disable-next-line no-unused-vars
  const __testEditable = cb => {
    const div = document.createElement('div');
    div.id = 'editable-only';
    div.innerHTML = editableContents;
    document.body.appendChild(div);
    const out = cb();
    document.body.removeChild(div);
    return out;
  };

  if (!e.getUserInput) {
    e.getUserInput = () => code;
  }

  /* eslint-disable no-unused-vars */
  // Fake Deep Equal dependency
  const DeepEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  // Hardcode Deep Freeze dependency
  const DeepFreeze = o => {
    Object.freeze(o);
    Object.getOwnPropertyNames(o).forEach(function(prop) {
      if (
        o.hasOwnProperty(prop) &&
        o[prop] !== null &&
        (typeof o[prop] === 'object' || typeof o[prop] === 'function') &&
        !Object.isFrozen(o[prop])
      ) {
        DeepFreeze(o[prop]);
      }
    });
    return o;
  };

  // eslint-disable-next-line no-inline-comments
  const { default: chai } = await import(/* webpackChunkName: "chai" */ 'chai');
  const assert = chai.assert;
  /* eslint-enable no-unused-vars */

  let Enzyme;
  if (e.loadEnzyme) {
    let Adapter16;
    /* eslint-disable no-inline-comments */

    [{ default: Enzyme }, { default: Adapter16 }] = await Promise.all([
      import(/* webpackChunkName: "enzyme" */ 'enzyme'),
      import(/* webpackChunkName: "enzyme-adapter" */ 'enzyme-adapter-react-16')
    ]);
    /* eslint-enable no-inline-comments */

    Enzyme.configure({ adapter: new Adapter16() });
  }

  document.__runTest = async function runTests(testString) {
    // uncomment the following line to inspect
    // the frame-runner as it runs tests
    // make sure the dev tools console is open
    // debugger;
    try {
      // eval test string to actual JavaScript
      // This return can be a function
      // i.e. function() { assert(true, 'happy coding'); }
      const testPromise = new Promise((resolve, reject) =>
        // To avoid race conditions, we have to run the test in a final
        // document ready:
        $(() => {
          try {
            // eslint-disable-next-line no-eval
            const test = eval(testString);
            resolve({ test });
          } catch (err) {
            reject({ err });
          }
        })
      );
      const { test, err } = await testPromise;
      if (err) throw err;

      if (typeof test === 'function') {
        await test(e.getUserInput);
      }
      return { pass: true };
    } catch (err) {
      if (!(err instanceof chai.AssertionError)) {
        console.error(err);
      }
      // return the error so that the curriculum tests are more informative
      return { err };
    }
  };
}
