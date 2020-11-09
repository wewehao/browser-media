(function (factory) {
  factory(window);
  //umd returnExports.js
  if (typeof (define) == 'function' && define.amd) {
    define(function () {
      return BrowserMedia;
    });
  }
  if (typeof (module) == 'object' && module.exports) {
    module.exports = BrowserMedia;
  }
}(function (window) {
  "use strict";
  const BrowserMedia = function (set) {
    return new initFn(set);
  };

  function initFn(set) {
    const o = {
      video: {
        facingMode: 'environment',
        width: 1280,
        height: 720
      },
      // video: true,
      audio: true,
      type: 'image',
      filter: 'Normal',
      autoClose: true
    };
    if (typeof set === 'object') {
      if (set) {
        for (let k in set) {
          o[k] = set[k];
        }
      }
    }
    this.set = o;
  }

  function createCanvas(set) {
    if (!document.querySelector('#canvas')) {
      const canvas = document.createElement('canvas');
      canvas.id = 'canvas';
      canvas.style.width = '100%';
      if (set.type === 'image' || !set.type) {
        // canvas.style.height = '100%';
      }
      if (set.type === 'video') {
        canvas.style.height = 'auto';
      }
      document.querySelector(set.el).parentNode.replaceChild(canvas, document.querySelector(set.el));
    }
    return document.querySelector('#canvas');
  }

  function createVideo(set) {
    if (!document.querySelector('#video')) {
      const video = document.createElement('video');
      video.id = 'video';
      video.style.display = 'none';
      document.querySelector('#canvas').parentNode.appendChild(video);
    }
    return document.querySelector('#video');
  }

  function createImg() {
    if (!document.querySelector('#media-icon')) {
      const img = document.createElement('i');
      img.id = 'media-icon';
      img.style.position = 'absolute';
      img.style.top = '-100%';
      img.style.left = '-100%';
      document.body.appendChild(img);
    }
    return document.querySelector('#media-icon');
  }

  function base64ToBlob(dataUrl, type) {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1] || type;
    const bytes = window.atob(arr[1]);
    const ab = new ArrayBuffer(bytes.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < bytes.length; i++) {
      ia[i] = bytes.charCodeAt(i);
    }
    return new Blob([ab], {
      type: mime
    });
  }

  BrowserMedia.prototype = initFn.prototype = {
    async open() {
      this.recordStatus = ''
      this.isOpen = false;

      if (!navigator.mediaDevices) {
        return false;
      }

      const devices = await navigator.mediaDevices.enumerateDevices() || []
      const cam = devices.find(function (device) {
        return device.kind === "videoinput";
      });
      const mic = devices.find(function (device) {
        return device.kind === "audioinput";
      });
      if (!cam) {
        this.set.video = false;
      }
      if (!mic) {
        this.set.audio = false;
      }

      const MediaStream = navigator.mediaDevices && await navigator.mediaDevices.getUserMedia(this.set);
      if (!MediaStream) {
        console.error('navigator.mediaDevices.getUserMedia 开启失败，请检查浏览器支持及是否在本地环境或https下。');
        this.isOpen = false;
        return false;
      }
      this.isOpen = true;

      this.canvas = createCanvas(this.set);
      this.context = this.canvas.getContext('2d');
      this.video = createVideo(this.set);

      this.video.addEventListener("loadeddata", () => {
        this.canvas.setAttribute('height', this.video.videoHeight);
        this.canvas.setAttribute('width', this.video.videoWidth);

        // canvas镜像左右翻转 未找到视频录制镜像翻转方法
        // this.context.translate(canvas.width, 0);
        // this.context.scale(-1, 1);

        this.draw();
      });

      this.MediaStream = MediaStream;
      this.mediaRecorder = new window.MediaRecorder(MediaStream);
      this.chunks = [];
      this.mediaRecorder.ondataavailable = e => {
        this.chunks.push(e.data);
      };
      this.mediaRecorder.onstart = () => {
        this.recordStatus = 'recording'
        if (this.onRecordStatusChange) {
          this.onRecordStatusChange(this.recordStatus)
        }
      }
      this.mediaRecorder.onstop = () => {
        this.recorderFile = new Blob(this.chunks, {
          type: this.mediaRecorder.mimeType
        });
        this.chunks = [];
        this.recordCallback(this.convertRecordFile(this.recorderFile))
        this.recordStatus = ''
        if (this.onRecordStatusChange) {
          this.onRecordStatusChange(this.recordStatus)
        }
      };

      this.video.srcObject = MediaStream;
      this.video.play();
      return true;
    },
    close() {
      if (!this.isOpen) return false;
      if (this.MediaStream) {
        this.isOpen = false;
        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.MediaStream.getTracks().forEach(track => {
          if (track.readyState == 'live') {
            track.stop();
          }
        })
      }
    },
    draw() {
      if (!this.isOpen) return false;
      // 计算偏移量
      const imageWidth = this.video.videoWidth;
      const imageHeight = this.video.videoHeight;
      const imageRatio = imageWidth / imageHeight;
      const canvasRatio = this.canvas.clientWidth / this.canvas.clientHeight;
      let sx, sy, sHeight, sWidth;
      if (imageRatio < canvasRatio) {
        sWidth = imageWidth;
        sHeight = sWidth / canvasRatio;
        sx = 0;
        sy = (imageHeight - sHeight) / 2;
      } else {
        sHeight = imageHeight;
        sWidth = imageHeight * canvasRatio;
        sy = 0;
        sx = (imageWidth - sWidth) / 2;
      }
      this.context.drawImage(this.video, sx, sy, sWidth, sHeight, 0, 0, this.video.videoWidth, this.video.videoHeight);
      this.pixels = this.context.getImageData(0, 0, video.videoWidth, video.videoHeight);
      if (this.set.filter !== 'Normal') {
        this.setPixels(this.set.filter, 'wasm');
      }
      this.context.putImageData(this.pixels, 0, 0);
      window.requestAnimationFrame(() => {
        this.draw();
      });
    },
    async shot() {
      if (!this.isOpen) return false;
      if (this.recordStatus === 'recording') {
        console.error('正在录制视频')
        return false;
      }
      if (this.set.autoClose) {
        this.close();
      }
      const base64 = this.canvas.toDataURL('image/jpeg');
      return base64ToBlob(base64);
    },
    startRecord() {
      if (!this.isOpen) return false;
      if (this.mediaRecorder) {
        this.mediaRecorder.start();
      }
    },
    stopRecord(callback, videoResultType) {
      if (!this.isOpen) return false;
      if (this.mediaRecorder) {
        if (callback) {
          this.recordCallback = callback;
        }
        if (videoResultType) {
          this.videoResultType = videoResultType;
        }
        this.mediaRecorder.stop();
        if (this.set.autoClose) {
          this.close();
        }
      }
    },
    convertRecordFile(recorderFile) {
      const file = new File(
        [recorderFile],
        'msr-' + new Date().toISOString().replace(/:|\./g, '-') + '.mp4',
        {
          type: 'video/mp4'
        }
      );
      if (this.videoResultType === 'file') return file;
      const URL = window.URL || window.webkitURL;
      const blob = URL.createObjectURL(file);
      return blob;
    },
    setMediaType(type) {
      const video = document.querySelector('#video');
      if (type === 'video') {
        video.style.height = 'auto';
      }
      if (type === 'image') {
        video.style.height = '100%';
      }
    },
    setPixels(filter) {
      const { pixels } = this;
      const cw = this.video.videoWidth;
      const ch = this.video.videoHeight;
      try {
        switch (filter) {
          case 'Grayscale':
            pixels.data.set(wasm.grayScale(pixels.data));
            break;
          case 'Brighten':
            pixels.data.set(wasm.brighten(pixels.data));
            break;
          case 'Invert':
            pixels.data.set(wasm.invert(pixels.data));
            break;
          case 'Noise':
            pixels.data.set(wasm.noise(pixels.data));
            break;
          case 'Sunset':
            pixels.data.set(wasm.sunset(pixels.data, cw));
            break;
          case 'Analog TV':
            pixels.data.set(wasm.analogTV(pixels.data, cw));
            break;
          case 'Emboss':
            pixels.data.set(wasm.emboss(pixels.data, cw));
            break;
          case 'Super Edge':
            pixels.data.set(wasm.sobelFilter(pixels.data, cw, ch));
            break;
          case 'Super Edge Inv':
            pixels.data.set(wasm.sobelFilter(pixels.data, cw, ch, true));
            break;
          case 'Gaussian Blur':
            pixels.data.set(wasm.blur(pixels.data, cw, ch));
            break;
          case 'Sharpen':
            pixels.data.set(wasm.sharpen(pixels.data, cw, ch));
            break;
          case 'Uber Sharpen':
            pixels.data.set(wasm.strongSharpen(pixels.data, cw, ch));
            break;
          case 'Clarity':
            pixels.data.set(wasm.clarity(pixels.data, cw, ch));
            break;
          case 'Good Morning':
            pixels.data.set(wasm.goodMorning(pixels.data, cw, ch));
            break;
          case 'Acid':
            pixels.data.set(wasm.acid(pixels.data, cw, ch));
            break;
          case 'Urple':
            pixels.data.set(wasm.urple(pixels.data, cw));
            break;
          case 'Forest':
            pixels.data.set(wasm.forest(pixels.data, cw));
            break;
          case 'Romance':
            pixels.data.set(wasm.romance(pixels.data, cw));
            break;
          case 'Hippo':
            pixels.data.set(wasm.hippo(pixels.data, cw));
            break;
          case 'Longhorn':
            pixels.data.set(wasm.longhorn(pixels.data, cw));
            break;
          case 'Underground':
            pixels.data.set(wasm.underground(pixels.data, cw));
            break;
          case 'Rooster':
            pixels.data.set(wasm.rooster(pixels.data, cw));
            break;
          case 'Moss':
            pixels.data.set(wasm.moss(pixels.data, cw));
            break;
          case 'Mist':
            pixels.data.set(wasm.mist(pixels.data, cw));
            break;
          case 'Tingle':
            pixels.data.set(wasm.tingle(pixels.data, cw));
            break;
          case 'Kaleidoscope':
            pixels.data.set(wasm.kaleidoscope(pixels.data, cw));
            break;
          case 'Bacteria':
            pixels.data.set(wasm.bacteria(pixels.data, cw));
            break;
          case 'Dewdrops':
            pixels.data.set(wasm.dewdrops(pixels.data, cw, ch));
            break;
          case 'Color Destruction':
            pixels.data.set(wasm.destruction(pixels.data, cw, ch));
            break;
          case 'Hulk Edge':
            pixels.data.set(wasm.hulk(pixels.data, cw));
            break;
          case 'Ghost':
            pixels.data.set(wasm.ghost(pixels.data, cw));
            break;
          case 'Swasmp':
            pixels.data.set(wasm.swasmp(pixels.data, cw));
            break;
          case 'Twisted':
            pixels.data.set(wasm.twisted(pixels.data, cw));
            break;
          case 'Security':
            pixels.data.set(wasm.security(pixels.data, cw));
            break;
          case 'Robbery':
            pixels.data.set(wasm.robbery(pixels.data, cw));
            break;
        }
      } catch (e) {
        console.log(e);
      }
    },
    setFilter(filter) {
      this.set.filter = filter;
    }
  };

  window.BrowserMedia = BrowserMedia;
}));
