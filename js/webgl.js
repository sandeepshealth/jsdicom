var gl;
var shaderProgram;
var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var squareVertexPositionBuffer;
var vertexIndexBuffer;
var THE_TEXTURE;
var ww = 200;
var wl = 40;

function initGL(canvas) {
    try {
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}


function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}



function initShaders() {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");  
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute); 

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
    shaderProgram.wlUniform = gl.getUniformLocation(shaderProgram, "uWL");
    shaderProgram.wwUniform = gl.getUniformLocation(shaderProgram, "uWW");
}



function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

function setWindowUniforms() {
    gl.uniform1f(shaderProgram.wlUniform, wl);
    gl.uniform1f(shaderProgram.wwUniform, ww);
}

function initBuffers() {

    squareVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    vertices = [
        -1.0,  -1.0,  0.0,
         1.0,  -1.0,  0.0,
         1.0,   1.0,  0.0,
        -1.0,   1.0,  0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    squareVertexPositionBuffer.itemSize = 3;
    squareVertexPositionBuffer.numItems = 4;
 
    // Texture coords
    textureCoordBuffer = gl.createBuffer();  
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);  
    
    var textureCoordinates = [  
        0.0,  0.0,  
        1.0,  0.0,  
        1.0,  1.0,  
        0.0,  1.0
    ];  
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),  
                  gl.STATIC_DRAW);
    textureCoordBuffer.itemSize = 2;
    textureCoordBuffer.numItems = 4;

    vertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
    var vertexIndices = [
        0, 1, 2, 0, 2, 3    
    ];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndices), gl.STATIC_DRAW);
    vertexIndexBuffer.itemSize = 1;
    vertexIndexBuffer.numItems = 6;
}

function initTexture() {
    var rgbconverted = new Uint8Array(512*512*3);
    //for(var i=0; i<rgbconverted.length;++i) {
    //    rgbconverted[i] = Math.round(Math.random()*256);
   // }
    for(var i=0; i<pixel_data.length;i+=2) {
        var val = pixel_data[i+1]*256.0 + pixel_data[i];
        fval = val / 3000.0;
        if(i%1000 == 0)
            var foo;
        rgbconverted[(i/2)*3] = fval;
        rgbconverted[(i/2)*3+1] = fval;
        rgbconverted[(i/2)*3+2] = fval;
    }
    THE_TEXTURE = gl.createTexture(); 
    gl.bindTexture(gl.TEXTURE_2D, THE_TEXTURE);  
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D,        // target
                  0,                    // level
                  gl.LUMINANCE_ALPHA,   // internalformat
                  512,                  // width
                  512,                  // height 
                  0,                    // border
                  gl.LUMINANCE_ALPHA,   // format
                  gl.UNSIGNED_BYTE,     // type
                  pixel_data);          // data
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                  
    gl.bindTexture(gl.TEXTURE_2D, null);

}

var zdist = -3.0;
function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, [.0, 0.0, zdist]);

    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                           squareVertexPositionBuffer.itemSize, 
                           gl.FLOAT, 
                           false, 
                           0, 
                           0);

    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, textureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);  
    gl.bindTexture(gl.TEXTURE_2D, THE_TEXTURE);  
    gl.uniform1i(shaderProgram.samplerUniform, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
    setMatrixUniforms();
    setWindowUniforms();
    gl.drawElements(gl.TRIANGLES, vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

}

function webGLStart() {
    var canvas = document.getElementById("glcanvas");
    initGL(canvas);
    initShaders();
    initBuffers();
    initTexture();
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    drawScene();
}
