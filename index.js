/** @type {HTMLTextAreaElement} */
const inputTextArea = document.querySelector('#inputTextArea');

/** @type {HTMLTextAreaElement} */
const outputTextArea = document.querySelector('#outputTextArea');

/** @type {HTMLButtonElement} */
const randomButton = document.querySelector('#randomButton');

/** @type {HTMLButtonElement} */
const rotateButton = document.querySelector('#rotateButton');

/** @type {HTMLDivElement} */
const mainDiv = document.querySelector('#mainDiv');

/** @type {HTMLButtonElement} */
const themeButton = document.querySelector('#themeButton');

/** @type {HTMLButtonElement} */
const copyButton = document.querySelector('#copyButton');

function convert(/** @type {string} */ json) {
  if (!json) {
    return '';
  }

  try {
    const result = JSON.parse(json, (key, value) => {
      switch (typeof value) {
        case 'string': {
          return { key, value: `'${value.replace(/'/g, '\'')}'` };
        }
        case 'number': case 'boolean': {
          return { key, value };
        }
        case 'object': {
          if (value === null) {
            return { key, value: 'null' };
          }

          const isArray = Array.isArray(value);
          let index = 0;

          /** @type {string[]} */
          const items = [];
          for (const key in value) {
            const item = value[key];
            switch (typeof item) {
              // Handle the key value pairs representing plain values
              case 'object': {
                if (isArray) {
                  if (+item.key !== index++) {
                    throw new Error(`Arrays must be zero-indexed and the indexes need to be monotonic without skips. Key: ${key}`);
                  }

                  items.push(item.value);
                }
                else {
                  items.push(`'${item.key}'`, item.value);
                }

                break;
              }

              // Handle the converted snippets of the query
              case 'string': {
                if (isArray) {
                  items.push(item);
                  index++;
                }
                else {
                  items.push(`'${key}'`, item);
                }

                break;
              }

              // Throw when an unexpected state model is present
              default: {
                throw new Error(`Only strings and objects are allowed here. Key: ${key}`);
              }
            }
          }

          return `${isArray ? 'json_build_array' : 'json_build_object'}(${items.join(', ')})`;
        }
        case 'bigint': {
          throw new Error(`BigInts are not allowed in the input JSON. Key: ${key}`);
        }
        case 'undefined': {
          throw new Error(`Undefineds are not allowed in the input JSON. Key: ${key}`);
        }
        case 'function': {
          throw new Error(`Functions are not allowed in the input JSON. Key: ${key}`);
        }
        case 'symbol': {
          throw new Error(`Symbols are not allowed in the input JSON. Key: ${key}`);
        }
      }

      // Note that will never happen because of the switch statement
      throw new Error(`Unknown type: ${typeof value}`);
    });

    // Handle people pasting it plain values as the roots of the JSON payload
    if (typeof result !== 'string') {
      if (result.key !== '') {
        throw new Error(`Expected root plain value but got something with a key: ${result.key}`);
      }

      return result.value.toString();
    }

    return result;
  }
  catch (error) {
    return error.message;
  }
}

// Convert at the page load if case the browser has recovered the text area text
outputTextArea.value = convert(inputTextArea.value);

// Convert the JSON text to the `json_build_object` code with each change
inputTextArea.addEventListener('input', () => outputTextArea.value = convert(inputTextArea.value));

// Indent using Tab with two spaces as it should be
inputTextArea.addEventListener('keydown', event => {
  if (event.key !== 'Tab') {
    return;
  }

  event.preventDefault();
  inputTextArea.setRangeText('  ', inputTextArea.selectionStart, inputTextArea.selectionEnd, 'end');
});

randomButton.addEventListener('click', () => {
  const test = tests[Math.random() * tests.length | 0];
  inputTextArea.value = test.input;
  outputTextArea.value = convert(inputTextArea.value);
});

rotateButton.addEventListener('click', () => {
  const layout = document.body.classList.contains('vertical') ? 'row' : 'column';
  document.body.classList.toggle('horizontal', layout === 'row');
  document.body.classList.toggle('vertical', layout === 'column');
  rotateButton.textContent = `Toggle layout: ${layout === 'row' ? '↔️ → ↕️' : '↕️ → ↔️'}`;
  localStorage.setItem(location.href + '|layout', layout);
});

const layout = localStorage.getItem(location.href + '|layout') ?? 'row';
document.body.classList.toggle('horizontal', layout === 'row');
document.body.classList.toggle('vertical', layout === 'column');
rotateButton.textContent = `Toggle layout: ${layout === 'row' ? '↔️ → ↕️' : '↕️ → ↔️'}`;

themeButton.addEventListener('click', () => {
  const theme = document.body.classList.contains('dark') ? 'light' : 'dark';
  document.body.classList.toggle('dark', theme === 'dark');
  document.body.classList.toggle('light', theme === 'light');
  themeButton.textContent = `Toggle theme: ${theme === 'dark' ? '🌚︎ → 🌞︎︎' : '🌚︎ → 🌞︎︎'}`;
  localStorage.setItem(location.href + '|theme', theme);
});

const theme = localStorage.getItem(location.href + '|theme') ?? 'dark';
document.body.classList.toggle('dark', theme === 'dark');
document.body.classList.toggle('light', theme === 'light');
themeButton.textContent = `Toggle theme: ${theme === 'dark' ? '🌚︎ → 🌞︎︎' : '🌚︎ → 🌞︎︎'}`;

copyButton.addEventListener('click', () => {
  navigator.clipboard.writeText(outputTextArea.value);
  copyButton.textContent = '✅ Copied!';
  window.setTimeout(() => copyButton.textContent = '📄 Copy result', 1000);
});

// Run tests to make sure no change has regressed the expected test cases
// Skip a test by prefixing it with `void`: `void { input: …, output: … }`
// Skip all tests by prefixing this with `void`: `void [ { input: …, output: … } ]`
// Limit to a single test by calling `tests.splice` and `push`ing the sole test
const tests = [
  {
    input: '',
    output: '',
  },

  // Value roots
  {
    input: 'null',
    output: 'null',
  },
  {
    input: '1',
    output: '1',
  },
  {
    input: 'true',
    output: 'true',
  },
  {
    input: '"a"',
    output: `'a'`,
  },

  // Array roots
  {
    input: '[ null ]',
    output: 'json_build_array(null)',
  },
  {
    input: '[ 1 ]',
    output: 'json_build_array(1)',
  },
  {
    input: '[ true ]',
    output: 'json_build_array(true)',
  },
  {
    input: '[ "a" ]',
    output: `json_build_array('a')`,
  },

  // Object roots
  {
    input: '{ "field": null }',
    output: `json_build_object('field', null)`,
  },
  {
    input: '{ "field": 1 }',
    output: `json_build_object('field', 1)`,
  },
  {
    input: '{ "field": true }',
    output: `json_build_object('field', true)`,
  },
  {
    input: '{ "field": "a" }',
    output: `json_build_object('field', 'a')`,
  },

  // Array in array
  {
    input: '[ [ null ] ]',
    output: `json_build_array(json_build_array(null))`,
  },
  {
    input: '[ [ 1 ] ]',
    output: `json_build_array(json_build_array(1))`,
  },
  {
    input: '[ [ true ] ]',
    output: `json_build_array(json_build_array(true))`,
  },
  {
    input: '[ [ "a" ] ]',
    output: `json_build_array(json_build_array('a'))`,
  },

  // Array in object
  {
    input: '{ "field": [ null ] }',
    output: `json_build_object('field', json_build_array(null))`,
  },
  {
    input: '{ "field": [ 1 ] }',
    output: `json_build_object('field', json_build_array(1))`,
  },
  {
    input: '{ "field": [ true ] }',
    output: `json_build_object('field', json_build_array(true))`,
  },
  {
    input: '{ "field": [ "a" ] }',
    output: `json_build_object('field', json_build_array('a'))`,
  },

  // Object in array
  {
    input: '[ { "field": null } ]',
    output: `json_build_array(json_build_object('field', null))`,
  },
  {
    input: '[ { "field": 1 } ]',
    output: `json_build_array(json_build_object('field', 1))`,
  },
  {
    input: '[ { "field": true } ]',
    output: `json_build_array(json_build_object('field', true))`,
  },
  {
    input: '[ { "field": "a" } ]',
    output: `json_build_array(json_build_object('field', 'a'))`,
  },

  // Object in object
  {
    input: '{ "field": { "field": null } }',
    output: `json_build_object('field', json_build_object('field', null))`,
  },
  {
    input: '{ "field": { "field": 1 } }',
    output: `json_build_object('field', json_build_object('field', 1))`,
  },
  {
    input: '{ "field": { "field": true } }',
    output: `json_build_object('field', json_build_object('field', true))`,
  },
  {
    input: '{ "field": { "field": "a" } }',
    output: `json_build_object('field', json_build_object('field', 'a'))`,
  },

  /* Random stuff I found later */

  // Object in an array following plain values and a nested stress test variant
  {
    input: '[ "a", {}, "c" ]',
    output: `json_build_array('a', json_build_object(), 'c')`,
  },
  {
    input: '[ "a", {}, "c", [ 1, {}, 3 ] ]',
    output: `json_build_array('a', json_build_object(), 'c', json_build_array(1, json_build_object(), 3))`,
  }
];

let errors = 0;
for (const test of tests ?? []) {
  if (!test) {
    continue;
  }

  const result = convert(test.input);

  if (test.output === result) {
    console.groupCollapsed('PASS:', test.input);
    console.log('Expected:', test.output);
    console.log('Actual:', result);
    console.groupEnd();
  }
  else {
    console.group('FAIL:', test.input);
    console.log('Expected:', test.output);
    console.log('Actual:', result);
    console.groupEnd();

    errors++;
  }
}

if (errors) {
  alert(`${errors}/${tests.length} tests failed! See the console for more details.`);
}
