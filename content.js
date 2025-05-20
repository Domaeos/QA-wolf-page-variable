(() => {
    let settings = {
        enabled: false,
        variableName: 'pageTwo',
    };

    let lastValidValue = settings.variableName;
    let isPerformingReplacement = false;

    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func(...args);
            }, wait);
        };
    }

    function isValidJavaScriptVariableName(name) {
        const validNameRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
        const reservedKeywords = [
            'abstract', 'arguments', 'await', 'boolean', 'break', 'byte', 'case', 'catch',
            'char', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do',
            'double', 'else', 'enum', 'eval', 'export', 'extends', 'false', 'final',
            'finally', 'float', 'for', 'function', 'goto', 'if', 'implements', 'import',
            'in', 'instanceof', 'int', 'interface', 'let', 'long', 'native', 'new', 'null',
            'package', 'private', 'protected', 'public', 'return', 'short', 'static',
            'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient',
            'true', 'try', 'typeof', 'var', 'void', 'volatile', 'while', 'with', 'yield'
        ];

        return validNameRegex.test(name) && !reservedKeywords.includes(name);
    }

    function init() {
        const debouncedReplacePageVariable = debounce(function (reset = false, refresh = false) {
            if (settings.enabled || reset) {
                replacePageVariable(reset, refresh);
            }
        }, 200);

        const observer = new MutationObserver(function (mutations) {
            if (isPerformingReplacement) return;

            if (!document.querySelector('.page-replacer-container')) {
                injectUI();
            }

            const shouldReplace = mutations.some(mutation => {
                const isReplacerUI = mutation.target.closest('.page-replacer-container');
                return !isReplacerUI && settings.enabled;
            });

            if (shouldReplace && settings.enabled) {
                debouncedReplacePageVariable(false, true);
            }

            // Select the button via the child SVG selector
            const copyButton = document.querySelector(
                'button > svg[data-e2e="icon-Clipboard"]'
            )?.parentElement;

            if (copyButton && !copyButton._pageReplacerHandlerAttached) {
                copyButton._pageReplacerHandlerAttached = true;
                copyButton.addEventListener('click', function () {
                    if (!settings.enabled) return;
                    console.log("Copy button clicked");
                    setTimeout(async function () {
                        try {
                            const clipText = await navigator.clipboard.readText();
                            const formattedClipText = clipText.replace(
                                /(?<=^await\s)(page)(?=\.)/g,
                                settings.variableName
                            );
                            await navigator.clipboard.writeText(formattedClipText);
                        } catch (err) { }
                    }, 500);
                });
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        injectUI();
        if (settings.enabled) {
            debouncedReplacePageVariable();
        }
    }

    function injectUI() {
        const targetElement = document.querySelector('[aria-label^="Automatic locator"]');
        if (!targetElement || document.querySelector('.page-replacer-container')) return;

        const container = document.createElement('div');
        container.className = 'page-replacer-container';

        const label = document.createElement('label');
        label.classList.add('switch');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'page-replacer-checkbox';
        checkbox.title = 'Enable/disable page variable replacement';

        const slider = document.createElement('span');
        slider.classList.add('slider', 'round');

        label.appendChild(checkbox);
        label.appendChild(slider);

        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.id = 'page-replacer-input';
        textInput.placeholder = 'Variable name';
        textInput.value = settings.variableName;
        textInput.classList.add('page-replacer-input', 'valid-input');
        textInput.setAttribute('title', 'Must be a valid JavaScript variable name');

        const validationMessage = document.createElement('span');
        validationMessage.id = 'variable-validation-message';
        validationMessage.classList.add('validation-message');

        const infoDiv = document.createElement('div');
        infoDiv.textContent = 'Replace page variable with: ';
        infoDiv.classList.add('replacer-info-text');

        const isChecked = targetElement.getAttribute('aria-checked') === 'true';
        if (isChecked) {
            container.classList.add('visible');
        } else {
            container.classList.remove('visible');
            checkbox.checked = false;
            textInput.disabled = true;
            settings.enabled = false;

        }

        targetElement.addEventListener('click', function () {
            setTimeout(function () {
                const isChecked = targetElement.getAttribute('aria-checked') === 'true';

                if (!isChecked) {
                    container.classList.remove('visible');
                    settings.enabled = false;
                    checkbox.checked = false;
                } else {
                    container.classList.add('visible');
                    settings.enabled = checkbox.checked;
                }
            }, 50);
        });

        checkbox.addEventListener('change', function (e) {
            settings.enabled = e.target.checked;
            textInput.disabled = !settings.enabled;
            validationMessage.classList.remove('visible');

            if (settings.enabled) {
                if (isValidJavaScriptVariableName(settings.variableName)) {
                    textInput.value = settings.variableName;
                    textInput.classList.remove('invalid-input');
                    textInput.classList.add('valid-input');

                    setTimeout(() => {
                        replacePageVariable(false, true);
                    }, 10);
                } else {
                    textInput.classList.remove('valid-input');
                    textInput.classList.add('invalid-input');
                    validationMessage.textContent = 'Invalid JavaScript variable name';
                    validationMessage.classList.add('visible');
                    settings.enabled = false;
                    checkbox.checked = false;
                }
            } else {
                replacePageVariable(true);
            }
        });

        const debouncedInputHandler = debounce(function (value) {
            if (settings.enabled && isValidJavaScriptVariableName(value)) {
                settings.variableName = value;
                lastValidValue = value;

                setTimeout(() => {
                    replacePageVariable(false, false);
                }, 10);
            }
        }, 300);

        textInput.addEventListener('input', function (e) {
            const newValue = e.target.value;

            if (newValue && isValidJavaScriptVariableName(newValue)) {
                textInput.classList.remove('invalid-input');
                textInput.classList.add('valid-input');
                validationMessage.classList.remove('visible');

                if (settings.enabled) {
                    debouncedInputHandler(newValue);
                } else {
                    settings.variableName = newValue;
                    lastValidValue = newValue;
                }
            } else {
                textInput.classList.remove('valid-input');
                textInput.classList.add('invalid-input');
                validationMessage.textContent = newValue ? 'Invalid JavaScript variable name' : 'Variable name cannot be empty';
                validationMessage.classList.add('visible');
            }
        });

        textInput.addEventListener('blur', function () {
            if (textInput.value !== lastValidValue) {
                if (!textInput.value || !isValidJavaScriptVariableName(textInput.value)) {
                    textInput.value = lastValidValue;
                    textInput.classList.remove('invalid-input');
                    textInput.classList.add('valid-input');
                    validationMessage.classList.remove('visible');
                }
            }
        });

        container.appendChild(label);
        container.appendChild(infoDiv);
        container.appendChild(textInput);
        container.appendChild(validationMessage);

        targetElement.parentNode.insertBefore(container, targetElement.nextSibling);
    }

    let lastReplacedVariable = "page";

    function replacePageVariable(reset = false, refresh = false) {
        if (!settings.enabled && !reset) return;

        isPerformingReplacement = true;

        try {
            const tokenLines = document.querySelectorAll(".token-line:not(.suggested-comment)");
            if (!tokenLines.length) return;

            const search = refresh ? "page" : lastReplacedVariable;
            const replace = reset ? "page" : settings.variableName;

            tokenLines.forEach(function (tokenLine) {
                const plainTokens = tokenLine.querySelectorAll(".token.plain");

                plainTokens.forEach(function (token) {
                    const trimmed = token.textContent.trim();
                    if (trimmed === search) {
                        const leading = token.textContent.startsWith(" ") ? " " : "";
                        const trailing = token.textContent.endsWith(" ") ? " " : "";
                        token.textContent = `${leading}${replace}${trailing}`;
                    }
                });
            });

            lastReplacedVariable = reset ? "page" : settings.variableName;
        } finally {
            setTimeout(() => {
                isPerformingReplacement = false;
            }, 0);
        }
    }

    init();
})();