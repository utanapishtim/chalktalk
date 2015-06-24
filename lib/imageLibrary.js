
   var imageLibrary_alpha = 0;
   var imageLibrary_images = [];
   var imageLibrary_index = -1;
   var imageLibrary_isVisible = false;
   var imageLibrary_rowHeight = 60;
   var imageLibrary_adjustVertical = 0;

   var myMouseEvent = new MouseEvent('mousedown');
   console.log(myMouseEvent);

   function imageLibrary_toggle() {
      if (imageLibrary_alpha == 1)
	 imageLibrary_alpha = 0.99;
      else
         imageLibrary_isVisible = ! imageLibrary_isVisible;
   }

   function imageLibrary_load() {
      function loadImages(ls) {
         for (var n = 0 ; n < ls.length ; n++) {
	    var str = ls[n];

	    if (str.length >= 5 && str.substring(0, 6) == 'title:') {
	       var message = str.substring(6, str.length);
               imageLibrary_images.push(message);
	    }
	    else {
               var image = new Image();
               image.src = "images/" + str;
               imageLibrary_images.push(image);
            }
         }
	 setTimeout(imageLibrary_createCanvasImage, 5000);
      }
      if (window.imageSequence !== undefined) {
         loadImages(imageSequence);
	 return;
      }
      try {
         var lsRequest = new XMLHttpRequest();
         lsRequest.open("GET", "ls_images");

         lsRequest.onloadend = function () {
            if (lsRequest.responseText != "")
	       loadImages(lsRequest.responseText.trim().split("\n"));
         }
         lsRequest.send();
      } catch (e) { }
   }

   function imageLibrary_createCanvasImage() {
      var i, x = 0, y = 0, dy = imageLibrary_rowHeight, image,
          canvas, context, iw, ih, xlo, xhi, ylo, yhi, lines, str, n;

      canvas = document.createElement('canvas');
      canvas.width = width();
      canvas.height = height();
      context = canvas.getContext('2d');

      for (i = 0 ; i < imageLibrary_images.length ; i++) {
         image = imageLibrary_images[i];
	 if (! (image instanceof Image)) {
	    context.fillStyle = defaultPenColor;
	    context.font = '12px Arial';
	    lines = image.split('\n');
	    for (n = 0 ; n < lines.length ; n++) {
	       str = lines[n];
               context.fillText(str, x + dy / 2 - textWidth(str, context) / 2,
	                             y + dy / 2 + (1 - lines.length + 2 * n) * 7);
            }
	    x += dy;
	 }
	 else {
            iw = dy * min(2, image.width / image.height);
            ih = iw * image.height / image.width;
            if (x + iw > width()) {
               x = 0;
               y += dy;
            }
            xlo = x;
            xhi = x + iw;
            ylo = y + (dy - ih) / 2;
            yhi = y + (dy + ih) / 2;
            context.drawImage(image, xlo + 5, ylo + 5, xhi - xlo - 10, yhi - ylo - 10);
            x += iw;
         }
      }
      imageLibrary_canvasImage = context.getImageData(0, 0, width(), height());
   }

   function imageLibrary_update() {
      var canvas = document.getElementById('slide');
      var context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);

      if (imageLibrary_isVisible) {
         imageLibrary_index = -1;
         imageLibrary_alpha =  0;
         (function() {
            var i, x = 0, y = 0, image, dy = imageLibrary_rowHeight, iw, ih, xlo, xhi, ylo, yhi;

            context.putImageData(imageLibrary_canvasImage, 0, 0);

            for (i = 0 ; i < imageLibrary_images.length ; i++) {
               image = imageLibrary_images[i];
	       if (! (image instanceof Image)) {
	          iw = dy;
	          ih = dy;
	       }
	       else {
                  iw = dy * min(2, image.width / image.height);
                  ih = iw * image.height / image.width;
               }
               if (x + iw > width()) {
                  x = 0;
                  y += dy;
               }
               xlo = x;
               xhi = x + iw;
               ylo = y + (dy - ih) / 2;
               yhi = y + (dy + ih) / 2;
               if ( xlo <= sketchPage.x && xhi > sketchPage.x &&
                    ylo <= sketchPage.y && yhi > sketchPage.y ) {

                  annotateStart(context);
                  context.lineWidth = 6;
                  context.strokeStyle = 'rgb(0,0,255)';
		  var save_g = _g;
		  _g = context;
		  drawRect(xlo, ylo, xhi - xlo, yhi - ylo);
		  _g = save_g;
                  annotateEnd(context);

                  imageLibrary_index = i;
                  imageLibrary_alpha = 1;
		  break;
               }
               x += iw;
            }
         })();
      }
      else if (imageLibrary_index >= 0) {
         (function() {
	    imageLibrary_adjustVertical = max(0, min(1, imageLibrary_adjustVertical + (isVideoLayer() ? .03 : -.03)));
	    var y0 = height() * mix(0.5, 0.69, sCurve(imageLibrary_adjustVertical));

            context.save();

            var image = imageLibrary_images[imageLibrary_index], w, h;
	    if (image instanceof Image) {
               if (image.width / image.height > width() / height()) {
                  w = width() * 0.55;
                  h = w * image.height / image.width;
               }
               else {
                  h = height() * 0.55;
                  w = h * image.width / image.height;
               }
            }

            if (imageLibrary_alpha < 1) {
               context.globalAlpha = sCurve(imageLibrary_alpha);
               imageLibrary_alpha -= 0.03;
               if (imageLibrary_alpha < 0.03) {
                  //imageLibrary_index = -1;
                  imageLibrary_alpha =  0;
               }
            }

	    if (image instanceof Image)
               context.drawImage(image, width() * .5 - w/2, y0 - h/2, w, h);
            else {
	       x = width() * .5;
	       y = y0;
	       dy = imageLibrary_rowHeight;
	       context.fillStyle = scrimColor(0.5);
	       var fh = floor(12 * height() / dy * 0.55);
	       context.font = fh + 'px Arial';
	       lines = image.split('\n');
	       for (n = 0 ; n < lines.length ; n++) {
	          str = lines[n];
                  context.fillText(str, x - textWidth(str, context) / 2,
	                                y + dy / 2 + (1 - lines.length + 2 * n) * fh / 2);
               }
	    }

            context.restore();
         })();
      }
   }
