window.showWelcome = function () {
    const popupTitle = "Welcome to ThunderBlocks"
    const msg = "ThunderBlocks is a powerful Scratch mod that compiles to Scratch. It has many new features, including:<ul><li>Making custom blocks that are custom reporters</li><li>Many new blocks, including an exponent block</li></ul>Everything then gets compiled into Scratch-compatible code. Every new block in ThunderBlocks should also work in Scratch. This allows for the creation of many complex projects easily.<br><br>To see a full list of everything added, check out the \"More Blocks\" extension.<button style='display: block;margin: 0 auto;color: white;padding: 10px 20px;background-color: darkblue;border-radius: 5px;border: none;' onclick='document.querySelector(`#tw-custom-popup-overlay`).remove()'>Go</button>"
    
    localStorage.setItem("firstTime", "false")
    // 1. Remove any existing popup to prevent duplicates
    const existing = document.getElementById('tw-custom-popup-overlay');
    if (existing) existing.remove();

    // 2. Create the Overlay (dark background)
    const overlay = document.createElement('div');
    overlay.id = 'tw-custom-popup-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.zIndex = '9999'; // Ensure it sits on top of everything
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.fontFamily = 'Helvetica, Arial, sans-serif';

    // 3. Create the Popup Box
    const box = document.createElement('div');
    box.style.backgroundColor = 'white';
    box.style.padding = '20px';
    box.style.borderRadius = '10px';
    box.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    box.style.width = '60%';
    box.style.position = 'relative';

    // 4. Create the Title
    const title = document.createElement('h2');
    title.innerText = popupTitle;
    title.style.marginTop = '0';
    title.style.color = '#333';

    // 5. Create the Message body
    const message = document.createElement('p');
    message.innerHTML = msg;
    message.style.color = '#666';
    message.style.lineHeight = '1.5';
    message.style.marginTop = '20px'

    // 6. Create the Close (X) Button
    const closeBtn = document.createElement('button');
    closeBtn.innerText = '×'; // Special character for X
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '10px';
    closeBtn.style.right = '10px';
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.fontSize = '24px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.color = '#999';

    // Add hover effect logic for the button (optional)
    closeBtn.onmouseenter = () => closeBtn.style.color = 'red';
    closeBtn.onmouseleave = () => closeBtn.style.color = '#999';

    // 7. Define what happens when X is clicked
    closeBtn.onclick = function () {
        overlay.remove();
    };

    // 8. Assemble the pieces
    box.appendChild(closeBtn);
    box.appendChild(title);
    box.appendChild(message);
    overlay.appendChild(box);

    // 9. Add to the actual document body
    document.body.appendChild(overlay);
}