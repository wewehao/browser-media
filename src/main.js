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
      // video: {
      //   facingMode: 'environment',
      //   width: 1,
      //   height: 1
      // },
      video: true,
      audio: true,
      type: 'image',
    };
    if (typeof set === 'object') {
      if (set) {
        for (let k in set) {
          o[k] = set[k];
        }
      }
    } else {
      o.el = set;
    }

    this.set = o;
  }

  function createVideo(set) {
    if (!document.querySelector('#video')) {
      const video = document.createElement('video');
      video.id = 'video';
      video.style.width = '100%';
      if (set.type === 'image' || !set.type) {
        video.style.height = '100%';
        video.style.objectFit = 'cover';
      }
      if (set.type === 'video') {
        video.style.height = 'auto';
        video.style.objectFit = 'contain';
      }
      document.querySelector(set.el).parentNode.replaceChild(video, document.querySelector(set.el));
    }
    return document.querySelector('#video');
  }

  function setMediaType(type) {
    const video = document.querySelector('#video');
    if (type === 'video') {
      video.style.height = 'auto';
      video.style.objectFit = 'contain';
    }
    if (type === 'image') {
      video.style.height = '100%';
      video.style.objectFit = 'cover';
    }
  }

  function createImg() {
    if (!document.querySelector('#img')) {
      const img = document.createElement('img');
      img.id = 'img';
      img.style.position = 'absolute';
      img.style.top = '-100%';
      img.style.left = '-100%';
      document.body.appendChild(img);
    }
  }

  function base64ToBlob(dataUrl, type) {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1] || type;
    // 去掉url的头，并转化为byte
    const bytes = window.atob(arr[1]);
    // 处理异常,将ascii码小于0的转换为大于0
    const ab = new ArrayBuffer(bytes.length);
    // 生成视图（直接针对内存）：8位无符号整数，长度1个字节
    const ia = new Uint8Array(ab);
    for (let i = 0; i < bytes.length; i++) {
      ia[i] = bytes.charCodeAt(i);
    }
    return new Blob([ ab ], {
      type: mime
    });
  }

  BrowserMedia.prototype = initFn.prototype = {
    open() {
      const media = navigator.mediaDevices && navigator.mediaDevices.getUserMedia(this.set);
      if (!media) {
        console.error('navigator.mediaDevices.getUserMedia 开启失败，请检查浏览器支持及是否在本地环境或https下。');
        this.isOpen = false;
        return false;
      }
      this.isOpen = true;
      const video = createVideo(this.set);
      createImg();
      media.then(MediaStream => {
        const track = MediaStream.getVideoTracks()[0];
        this.imageCapture = new ImageCapture(track);

        this.mediaRecorder = new window.MediaRecorder(MediaStream);
        this.chunks = [];
        this.mediaRecorder.ondataavailable = e => {
          this.chunks.push(e.data);
        };
        this.mediaRecorder.onstop = () => {
          this.recorderFile = new Blob(this.chunks, {
            type: this.mediaRecorder.mimeType
          });
          this.chunks = [];
          this.recordCallback(this.convertRecordFile(this.recorderFile))
        };

        video.srcObject = MediaStream;
        video.play();
      }).catch(err => {
        console.error(err);
        this.isOpen = false;
      });
      return true;
    },
    async shot() {
      if (!this.isOpen) return false;
      if (!document.querySelector('#canvas')) {
        const canvas = document.createElement('canvas');
        canvas.id = 'canvas';
        canvas.style.display = 'none';
        document.body.appendChild(canvas);
      }
      const blob = await this.imageCapture.takePhoto();
      const imageBitmap = await createImageBitmap(blob);
      const canvas = document.querySelector('#canvas');
      canvas.width = imageBitmap.width;
      canvas.height = imageBitmap.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imageBitmap, 0, 0, imageBitmap.width, imageBitmap.height);
      const base64 = canvas.toDataURL('image/png');

      const video = document.querySelector('#video');
      const img = document.querySelector('#img');
      img.style.backgroundImage = `url(${base64})`;
      img.style.backgroundSize = `cover`;
      img.style.backgroundPosition = `50% 50%`;
      img.width = video.clientWidth;
      img.height = video.clientHeight;
      const imageCanvas = await html2canvas(img);
      const imageBase64 = imageCanvas.toDataURL('image/png');
      return base64ToBlob(imageBase64);
    },
    startRecord() {
      if (!this.isOpen) return false;
      if (this.mediaRecorder) {
        this.mediaRecorder.start();
      }
    },
    stopRecord(callback) {
      if (!this.isOpen) return false;
      if (this.mediaRecorder) {
        if (callback) {
          this.recordCallback = callback;
        }
        this.mediaRecorder.stop();
      }
    },
    convertRecordFile(recorderFile) {
      const file = new File(
        [ recorderFile ],
        'msr-' + new Date().toISOString().replace(/:|\./g, '-') + '.mp4',
        {
          type: 'video/mp4'
        }
      );
      const URL = window.URL || window.webkitURL;
      const blob = URL.createObjectURL(file);
      return blob;
    },
    setMediaType
  };

  window.BrowserMedia = BrowserMedia;
}));
