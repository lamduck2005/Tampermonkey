// ==UserScript==
// @name         AutoRegSuper
// @namespace    http://tampermonkey.net/
// @version      1.2_InProgress
// @description  AutoRegSuper
// @author       LamDuck2005
// @match        *://*.duolingo.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    //GenEmail
    function generateRandomEmail() {
        const chars = 'abcdefghijklmnopqrstuvwxyz1234567890';
        let email = '';
        for (let i = 0; i < 10; i++) {
            email += chars[Math.floor(Math.random() * chars.length)];
        }
        return email + '@lamduck.com';
    }

    //input
    function setValue(selector, value) {
        const element = document.querySelector(selector);
        if (element) {
            const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set;
            const prototype = Object.getPrototypeOf(element);
            const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;

            if (valueSetter && valueSetter !== prototypeValueSetter) {
                prototypeValueSetter.call(element, value);
            } else {
                valueSetter.call(element, value);
            }

            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            element.dispatchEvent(new Event('blur', { bubbles: true }));

            const event = new Event('keyup', { bubbles: true });
            Object.defineProperty(event, 'keyCode', {
                get() {
                    return 13;
                }
            });
            element.dispatchEvent(event);
        }
    }

    // Hàm click vào một phần tử cụ thể
    function clickElement(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.click();
        }
    }

    // Hàm thêm nút cố định
    function addFixedButton() {
        // Nút Đăng ký
        const registerButton = createFixedButton('Start', 'top: 10px; right: 0px;', startAutoRegister);
        document.body.appendChild(registerButton);

        // Nút Tiếp tục
        const continueButton = createFixedButton('Course','top: 50px; right: 0px;', startChooseCourse);
        document.body.appendChild(continueButton);

        // Nút Đăng ký gói Plus
        const plusOfferButton = createFixedButton('Super', 'top: 90px; right: 0px;', startPlus);
        document.body.appendChild(plusOfferButton);

        // Nút lấy link
        const getLink = createFixedButton('Link', 'top: 130px; right: 0px;', getLinkSuper);
        document.body.appendChild(getLink);


        

    }

    // Hàm tạo nút cố định
    function createFixedButton(text, style, clickHandler) {
        const button = document.createElement('button');
        button.innerText = text;
        button.style.position = 'fixed';
        button.style.backgroundColor = '#007bff';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.padding = '5px 10px';
        button.style.width = '70px';
        button.style.cursor = 'pointer';
        button.style.borderRadius = '5px';
        button.style.zIndex = '9999';
        button.style.cssText += style;
        button.addEventListener('click', clickHandler);
        return button;
    }


    // Biến toàn cục để lưu trữ danh sách visas và chỉ số visa hiện tại
    let visas = [];
    let currentVisaIndex = 0;

    // Hàm thêm nút cố định và ô input
    function addFileInputAndButton() {
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.bottom = '10px';
        container.style.right = '10px';
        container.style.zIndex = '9999';

        // Thêm dòng hiển thị số thẻ hiện tại và tổng số thẻ
        const cardNumberLine = document.createElement('div');
        cardNumberLine.id = 'cardNumberLine';
        cardNumberLine.style.fontSize = '12px';
        cardNumberLine.style.color = 'gray';
        container.appendChild(cardNumberLine);

        const cardNumberInput = createTextInputWithCopyButton('cardNumberInput', 'Card');
        const expirationDateInput = createTextInputWithCopyButton('expirationDateInput', 'Exp');
        const cvcInput = createTextInputWithCopyButton('cvcInput', 'CVC');

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.style.display = 'none';
        fileInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const fileContent = e.target.result;
                    saveFileContentToLocalStorage(fileContent); // Lưu nội dung file vào localStorage
                    visas = fileContent.trim().split('\n'); // Lưu danh sách visas từ file đã tải lên
                    currentVisaIndex = 0; // Đặt lại chỉ số của visa hiện tại khi có file mới
                    displayVisa(currentVisaIndex); // Hiển thị visa đầu tiên
                    saveCurrentVisaIndex(currentVisaIndex); // Lưu chỉ số visa hiện tại vào localStorage
                    fileInput.value = ''; // Xóa giá trị file để có thể tải lên lại cùng một tệp
                };
                reader.readAsText(file);
            }
        });

        const navigateButton = document.createElement('button');
        navigateButton.innerText = 'Next'; // Text nút
        navigateButton.style.backgroundColor = '#007bff'; // Màu nút
        navigateButton.style.color = 'white'; // Màu chữ
        navigateButton.style.border = 'none'; // Không viền
        navigateButton.style.padding = '5px 10px'; // Kích thước
        navigateButton.style.cursor = 'pointer'; // Con trỏ tay
        navigateButton.style.borderRadius = '5px'; // Bo góc
        navigateButton.addEventListener('click', function() {
            currentVisaIndex = (currentVisaIndex + 1) % visas.length; // Di chuyển đến visa tiếp theo
            displayVisa(currentVisaIndex); // Hiển thị visa tiếp theo
            saveCurrentVisaIndex(currentVisaIndex); // Lưu chỉ số visa hiện tại vào localStorage
        });

        const uploadButton = document.createElement('button');
        uploadButton.innerText = 'Upload'; // Text nút
        uploadButton.style.backgroundColor = '#28a745'; // Màu nút
        uploadButton.style.color = 'white'; // Màu chữ
        uploadButton.style.border = 'none'; // Không viền
        uploadButton.style.padding = '5px 10px'; // Kích thước
        uploadButton.style.marginTop = '10px'; // Khoảng cách với nút điều hướng
        uploadButton.style.cursor = 'pointer'; // Con trỏ tay
        uploadButton.style.borderRadius = '5px'; // Bo góc
        uploadButton.addEventListener('click', function() {
            fileInput.click();
        });

        container.appendChild(cardNumberInput);
        container.appendChild(expirationDateInput);
        container.appendChild(cvcInput);
        container.appendChild(navigateButton);
        container.appendChild(uploadButton);
        container.appendChild(fileInput);
        document.body.appendChild(container);

        // Nếu đã có nội dung file từ trước (trong localStorage), tự động tải lên và hiển thị
        const savedFileContent = getFileContentFromLocalStorage();
        if (savedFileContent) {
            visas = savedFileContent.trim().split('\n'); // Lưu danh sách visas từ localStorage
            currentVisaIndex = getCurrentVisaIndex(); // Lấy chỉ số visa hiện tại từ localStorage
            displayVisa(currentVisaIndex); // Hiển thị visa hiện tại
        }
    }

    // Hàm lưu chỉ số visa hiện tại vào localStorage
    function saveCurrentVisaIndex(index) {
        localStorage.setItem('currentVisaIndex', index);
    }

    // Hàm lấy chỉ số visa hiện tại từ localStorage
    function getCurrentVisaIndex() {
        const index = localStorage.getItem('currentVisaIndex');
        return index ? parseInt(index) : 0;
    }



    function createTextInputWithCopyButton(id, placeholder) {
        const container = document.createElement('div');
        container.style.marginBottom = '10px'; // Để tạo khoảng cách giữa các ô input
    
        // Tạo ô input
        const input = document.createElement('input');
        input.id = id;
        input.type = 'text';
        input.placeholder = placeholder;
        input.style.width = '150px';
        input.style.padding = '5px';
        input.style.marginRight = '10px';
        input.style.fontSize = '14px';
        input.style.fontFamily = 'Arial, sans-serif';
        input.style.border = '1px solid #ccc';
        input.style.borderRadius = '5px';
        container.appendChild(input);
    
        // Tạo nút Copy
        const copyButton = document.createElement('button');
        copyButton.innerText = 'Copy';
        copyButton.style.backgroundColor = '#28a745'; // Màu nút Copy
        copyButton.style.color = 'white'; // Màu chữ nút Copy
        copyButton.style.border = 'none'; // Không viền
        copyButton.style.padding = '5px 10px'; // Kích thước
        copyButton.style.width = '60px'; // Kích thước
        copyButton.style.marginTop = '10px'; // Khoảng cách với ô input
        copyButton.style.cursor = 'pointer'; // Con trỏ tay
        copyButton.style.borderRadius = '5px'; // Bo góc
        copyButton.addEventListener('click', function() {
            try {
                // navigator.clipboard.writeText(input.value);
                input.setSelectionRange(0, 99999); // Chọn toàn bộ văn bản trong input
                input.select();

                navigator.clipboard
                .writeText(input.value)
                .then(() => {
                    // document.execCommand("copy");
                    // alert("successfully copied");
                })
                .catch(() => {
                    alert("something went wrong");
                });

                // Gợi ý cho người dùng rằng đã sao chép thành công
                copyButton.innerText = 'Done';
                setTimeout(function() {
                    copyButton.innerText = 'Copy';
                }, 1000); // Trở lại nút Copy sau 1 giây
            } catch (err) {
                console.error('Failed to copy text: ', err);
            }
        });
        container.appendChild(copyButton);
    
        return container;
    }
    

    

    // Hàm hiển thị visa lên các ô input
    function displayVisa(index) {
        const visa = visas[index];
        if (visa) {
            const parts = visa.split('|');
            if (parts.length === 4) {
                document.getElementById('cardNumberInput').value = parts[0];
                
                // Format ngày hết hạn dạng MM/YY
                const expirationMonth = parts[1].padStart(2, '0'); // Chèn số 0 vào đầu nếu thiếu
                const expirationYear = parts[2].slice(-2); // Lấy 2 số cuối năm
                document.getElementById('expirationDateInput').value = `${expirationMonth}/${expirationYear}`;
                
                // CVC ngắn lại để vừa
                document.getElementById('cvcInput').value = parts[3].slice(0, 3); // Lấy 3 số đầu của CVC
                
                // Hiển thị số thẻ hiện tại và tổng số thẻ
                const currentCardNumber = index + 1;
                const totalCards = visas.length;
                document.getElementById('cardNumberLine').textContent = `Card ${currentCardNumber}/${totalCards}`;
            }
        }
    }




    // Hàm lưu nội dung file vào localStorage
    function saveFileContentToLocalStorage(fileContent) {
        localStorage.setItem('uploadedFileContent', fileContent);
    }

    // Hàm đọc nội dung file từ localStorage
    function getFileContentFromLocalStorage() {
        return localStorage.getItem('uploadedFileContent');
    }



    function removeCSSEffects() {
        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = `
            * {
                transition: none !important;
                animation: none !important;
                filter: none !important;
            }
        `;
        document.head.appendChild(style);
    }
    


    function WaitClick(selector) {
        return new Promise(function(resolve) {
            var interval = setInterval(function() {
                var element = document.querySelector(selector);
                if (element) {
                    element.click();
                    clearInterval(interval);
                    resolve();
                }
            }, 500);
        });
    }

    function WaitInput(selector, value) {
        return new Promise(function(resolve) {
            var interval = setInterval(function() {
                var element = document.querySelector(selector);
                if (element) {
                    setValue(selector, value);
                    clearInterval(interval);
                    resolve();
                }
            }, 500);
        });
    }



    function startAutoRegister(){
        if (window.location.href !== 'https://www.duolingo.com/register') {
            if(window.location.href !== 'https://www.duolingo.com/'){
                window.location.href = 'https://www.duolingo.com/logout';
            } else {
                window.location.href = 'https://www.duolingo.com/register';
            }
            return;
        }

        WaitClick("#root > div:nth-child(1) > div > div._25k2b._3UsPY > div > div > ul > button:nth-child(1)");


        setTimeout(() => {
            
        }, timeout);
        
        // WaitClick("#root > div.qO_UG > header > div._15kfC > div._28m3G > div > a");
        // WaitClick("#root > div:nth-child(1) > div > div._25k2b._3UsPY > div > div > ul > button:nth-child(1)");
        // WaitClick("#overlays > div:nth-child(3) > div > div > div._1sSQy");
        // WaitClick("#root > div._3Cy6o._2kkzG > div > div.AkzqY > div > div._2SBm1._1UT5d._2YNyh > div > div:nth-child(4) > button._1XFai._1x5JY._1M9iF._36g4N._2YF0P.W5q2t.xMg2y");
        // WaitClick("#overlays > div:nth-child(3) > div > div > form > div._1zS0t > div._2t5Dr > span");
        // setTimeout(() => {
        //     WaitInput('input[data-test="age-input"]','20');
        //     WaitInput('input[data-test="full-name-input"]','Duck');
        //     WaitInput('input[data-test="email-input"]',generateRandomEmail());
        //     WaitInput('input[data-test="password-input"]','SuperDuo@0');
        //     setTimeout(() => {
        //         WaitClick('#overlays > div:nth-child(3) > div > div > form > div:nth-child(1) > button');
        //     }, 500);
        //     setTimeout(() => {
        //         startChooseCourse();
        //     }, 6000);
        // }, 1000);


        // WaitClick("#root > div.qO_UG > header > div._15kfC > div._28m3G > div > button");
        // WaitClick("#overlays > div:nth-child(3) > div > div > div._3MPka > button");
        // WaitClick("#overlays > div:nth-child(3) > div > div > form > div._1zS0t > div._2t5Dr > span");
        // setTimeout(() => {
        //     WaitInput('input[data-test="age-input"]','20');
        //     WaitInput('input[data-test="full-name-input"]','Duck');
        //     WaitInput('input[data-test="email-input"]',generateRandomEmail());
        //     WaitInput('input[data-test="password-input"]','SuperDuo@0');
        //     setTimeout(() => {
        //         WaitClick('#overlays > div:nth-child(3) > div > div > form > div:nth-child(1) > button');
        //     }, 500);
        //     setTimeout(() => {
        //         startChooseCourse();
        //     }, 6000);
        // }, 1000);


    }

    function startChooseCourse(){
        if (window.location.href == 'https://www.duolingo.com/welcome?welcomeStep=coursePicker') {
            WaitClick("#root > div:nth-child(1) > div > div._2U1WN > div._1E4jI._3WR3c > div._1PXFa > ul:nth-child(2) > div:nth-child(1)");

            setTimeout(() => {
                clickElement('button[data-test="funboarding-continue-button"]');
                WaitClick("#root > div:nth-child(1) > div > div._2U1WN > div._25F55 > div > button");
                setTimeout(() => {
                    window.location.href = 'https://www.duolingo.com/settings/super';
                }, 4000);
            }, 6000);


        } else {
                window.location.href = 'https://www.duolingo.com/settings/super';
        }
    }



    function startPlus(){
        if (window.location.href !== 'https://www.duolingo.com/settings/super') {
            window.location.href = 'https://www.duolingo.com/settings/super';
        }
        WaitClick('button[data-test="plus-offer-button"]');
        WaitClick('button[data-test="plus-continue"]');
        WaitClick('button[data-test="plus-continue"]');
        WaitClick('button[data-test="plus-continue"]');
        WaitClick('button[data-test="com_duolingo_stripe_subscription_premium_trial14_fam_twelvemonth_2022_q4_adj_vn_vnd_inclusive_89900000"]');
        WaitClick('button[data-test="plus-continue"]');
    }

    function getLinkSuper(){
        WaitClick('button[data-test="plus-continue"]');
        WaitClick('img[data-test="add-family-member"]');

        setTimeout(() => {
          const input = document.querySelector('input[value^="https://invite.duolingo.com/family-plan/"]').value.toString();
            if (input) {
                navigator.clipboard.writeText(input);
                alert(input);
            }  
        }, 1000);
        
    }

    function init(){
            removeCSSEffects();
            addFixedButton();
            addFileInputAndButton();
            setTimeout(() => {
                autoStart();
            }, 1000);
    }


    function autoStart(){
        if (window.location.href == 'https://www.duolingo.com/' || window.location.href == 'https://www.duolingo.com/register'){
            startAutoRegister();
        }
        if (window.location.href == 'https://www.duolingo.com/welcome'){
            window.location.href == 'https://www.duolingo.com/learn';
        }
        if (window.location.href == 'https://www.duolingo.com/welcome?welcomeStep=hdyhau'){
            window.location.href = 'https://www.duolingo.com/settings/super';
        }
        if (window.location.href == 'https://www.duolingo.com/settings/super'){
            const element = document.querySelector("#root > div._3Cy6o._2kkzG > div > div.AkzqY > div > div._2HEhk > div > section:nth-child(3) > ul > li._3W8HO.yGFAU");
            if (element) {
                getLinkSuper();
            } else {
                startPlus();
            }
        }

    }

    // window.addEventListener('load', function() {
    //     init();
    // });

    if (document.readyState === "complete") {
        init();
      } else {
        window.addEventListener('load', init());
        console.log('event here')
      }
    

})();
