window.ECB = function (key) {
  this._aes = new AES(key);
};

ECB.prototype.encrypt = function (text) {
  text = coerceArray(text);

  if (text.length % 16 !== 0) {
    throw new Error(
      'Неверный размер передаваемого текста (должен быть кратным 16 байтам).'
    );
  }

  let encText = createArray(text.length);
  let block = createArray(16);

  for (let i = 0; i < text.length; i += 16) {
    copyArray(text, block, 0, i, i + 16);
    block = this._aes.encrypt(block);
    copyArray(block, encText, i);
  }

  return encText;
};

ECB.prototype.decrypt = function (encText) {
  encText = coerceArray(encText);

  if (encText.length % 16 !== 0) {
    throw new Error('Неверный размер зашифрованного текста (должен быть кратным 16 байтам).');
  }

  let text = createArray(encText.length);
  let block = createArray(16);

  for (let i = 0; i < encText.length; i += 16) {
    copyArray(encText, block, 0, i, i + 16);
    block = this._aes.decrypt(block);
    copyArray(block, text, i);
  }

  return text;
};

window.CBC = function (key, iv) {
  if (!iv) {
    iv = createArray(16);
  } else if (iv.length != 16) {
    throw new Error('Неверный размер вектора инициализации (должен быть размером 16 байт).');
  }

  this._lastCipherblock = coerceArray(iv, true);

  this._aes = new AES(key);
};

CBC.prototype.encrypt = function (text) {
  text = coerceArray(text);

  if (text.length % 16 !== 0) {
    throw new Error(
      'Неверный размер передаваемого текста (должен быть кратным 16 байтам).'
    );
  }

  let encText = createArray(text.length);
  let block = createArray(16);

  for (let i = 0; i < text.length; i += 16) {
    copyArray(text, block, 0, i, i + 16);

    for (let j = 0; j < 16; j++) {
      block[j] ^= this._lastCipherblock[j];
    }

    this._lastCipherblock = this._aes.encrypt(block);
    copyArray(this._lastCipherblock, encText, i);
  }

  return encText;
};

CBC.prototype.decrypt = function (encText) {
  encText = coerceArray(encText);

  if (encText.length % 16 !== 0) {
    throw new Error('iНеверный размер зашифрованого текста (должен быть кратным 16 байтам).');
  }

  let text = createArray(encText.length);
  let block = createArray(16);

  for (let i = 0; i < encText.length; i += 16) {
    copyArray(encText, block, 0, i, i + 16);
    block = this._aes.decrypt(block);

    for (let j = 0; j < 16; j++) {
      text[i + j] = block[j] ^ this._lastCipherblock[j];
    }

    copyArray(encText, this._lastCipherblock, 0, i, i + 16);
  }

  return text;
};

window.CFB = function (key, iv, segmentSize) {
  if (!iv) {
    iv = createArray(16);
  } else if (iv.length != 16) {
    throw new Error('Неверный размер вектора инициализации (должен быть размером 16 байт).');
  }

  if (!segmentSize) {
    segmentSize = 1;
  }

  this.segmentSize = segmentSize;

  this._shiftRegister = coerceArray(iv, true);

  this._aes = new AES(key);
};

CFB.prototype.encrypt = function (text) {
  if (text.length % this.segmentSize != 0) {
    throw new Error(`Неверный размер вводимого текста (должен быть размером в ${this.segmentSize} байт)`);
  }

  let encrypted = coerceArray(text, true);

  let xorSegment;
  for (let i = 0; i < encrypted.length; i += this.segmentSize) {
    xorSegment = this._aes.encrypt(this._shiftRegister);
    for (let j = 0; j < this.segmentSize; j++) {
      encrypted[i + j] ^= xorSegment[j];
    }

    copyArray(this._shiftRegister, this._shiftRegister, 0, this.segmentSize);
    copyArray(
      encrypted,
      this._shiftRegister,
      16 - this.segmentSize,
      i,
      i + this.segmentSize
    );
  }

  return encrypted;
};

CFB.prototype.decrypt = function (encText) {
  if (encText.length % this.segmentSize != 0) {
    throw new Error(`Неверный размер зашифрованого текста (должен быть размером в ${this.segmentSize} байт)`);
  }

  let text = coerceArray(encText, true);

  let xorSegment;
  for (let i = 0; i < text.length; i += this.segmentSize) {
    xorSegment = this._aes.encrypt(this._shiftRegister);

    for (let j = 0; j < this.segmentSize; j++) {
      text[i + j] ^= xorSegment[j];
    }

    copyArray(this._shiftRegister, this._shiftRegister, 0, this.segmentSize);
    copyArray(
      encText,
      this._shiftRegister,
      16 - this.segmentSize,
      i,
      i + this.segmentSize
    );
  }

  return text;
};

window.OFB = function (key, iv) {
  if (!iv) {
    iv = createArray(16);
  } else if (iv.length != 16) {
    throw new Error('Неверный размер вектора инициализации (должен быть размером 16 байт).');
  }

  this._lastPrecipher = coerceArray(iv, true);
  this._lastPrecipherIndex = 16;

  this._aes = new AES(key);
};

OFB.prototype.encrypt = function (text) {
  let encrypted = coerceArray(text, true);

  for (let i = 0; i < encrypted.length; i++) {
    if (this._lastPrecipherIndex === 16) {
      this._lastPrecipher = this._aes.encrypt(this._lastPrecipher);
      this._lastPrecipherIndex = 0;
    }
    encrypted[i] ^= this._lastPrecipher[this._lastPrecipherIndex++];
  }

  return encrypted;
};

OFB.prototype.decrypt = OFB.prototype.encrypt;

window.Counter = function (initialValue) {
  if (initialValue !== 0 && !initialValue) {
    initialValue = 1;
  }

  this._counter = createArray(16);
  this.setValue(initialValue);
};

Counter.prototype.setValue = function (value) {
  if (typeof value !== 'number' || parseInt(value) != value) {
    throw new Error('Значением счетчика может быть только число');
  }

  for (var index = 15; index >= 0; --index) {
    this._counter[index] = value % 256;
    value = parseInt(value / 256);
  }
};

Counter.prototype.increment = function () {
  for (var i = 15; i >= 0; i--) {
    if (this._counter[i] === 255) {
      this._counter[i] = 0;
    } else {
      this._counter[i]++;
      break;
    }
  }
};

window.CTR = function (key, _, counter) {
  this._counter = counter;

  this._remainingCounter = null;
  this._remainingCounterIndex = 16;

  this._aes = new AES(key);
};

CTR.prototype.encrypt = function (text) {
  let encrypted = coerceArray(text, true);

  for (let i = 0; i < encrypted.length; i++) {
    if (this._remainingCounterIndex === 16) {
      this._remainingCounter = this._aes.encrypt(this._counter._counter);
      this._remainingCounterIndex = 0;
      this._counter.increment();
    }
    encrypted[i] ^= this._remainingCounter[this._remainingCounterIndex++];
  }

  return encrypted;
};

CTR.prototype.decrypt = CTR.prototype.encrypt;
