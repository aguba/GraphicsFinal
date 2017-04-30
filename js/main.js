var scene, camera, renderer;
var interval = 1;
var aspectRatio = window.innerWidth / window.innerHeight;

var raycaster;
var mouse;

var planeGeometry;
var planeMaterial;

var boxType = 'block';
var boxGeometry;

var boxMaterials = [];
var boxMaterialIndex = 0;
var textures = ['tile.png', 'brick.png', 'glass.png', 'grass.png'];

var hoverBoxMaterial;
var hoverBox;

var planeSize = 25;
var fov = 20;
var orthoWidth = (planeSize / 2) * aspectRatio;
var orthoHeight = planeSize / 2;
var planeCenter;
var planeCenterTarget;

var leftClicked;
var rightClicked;
var isDragging;
var deltaPoint;
var worldRot;

var mainGroup;
var rotationGroup;

var jsonObj;

window.onload = function () {
    init();

    document.getElementById('btnTileTexture').onclick = function () {
        boxType = 'block';
        boxMaterialIndex = 0;
    }

    document.getElementById('btnBrickTexture').onclick = function () {
        boxType = 'block';
        boxMaterialIndex = 1;
    }

    document.getElementById('btnGlassTexture').onclick = function () {
        boxType = 'block';
        boxMaterialIndex = 2;
    }

    document.getElementById('btnGrassTexture').onclick = function () {
        boxType = 'block';
        boxMaterialIndex = 3;
    }

    document.getElementById('btnTorch').onclick = function () {
        boxType = 'torch';
    }

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x808080);
    renderer.shadowMap.enabled = true;
    document.getElementById("container").appendChild(renderer.domElement);

    scene = new THREE.Scene();
    // camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.01, 1000);
    camera = new THREE.OrthographicCamera(-orthoWidth, orthoWidth, orthoHeight, -orthoHeight, 0.1, 1000);
    scene.add(camera);
    scene.add(rotationGroup);

    planeBuilder(planeSize, planeSize);

    var ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    var spotLight = new THREE.SpotLight(0x404040, 2, 600);
    spotLight.position.set(10, 20, -10);
    scene.add(spotLight);

    camera.position.set(-45, 45, -45);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    render();
}







//----------------Helper Functions-----------------------
window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('mousedown', onMouseDown, false);
window.addEventListener('mouseup', onMouseUp, false);
window.oncontextmenu = function () {
    return false;
}

var render = function () {
    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

var init = function () {
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    planeGeometry = new THREE.PlaneGeometry(1, 1);
    planeMaterial = new THREE.MeshStandardMaterial({
        metalness: 0,
        roughness: 0.2,
        map: new THREE.TextureLoader().load('../images/tile.png'),
        normalMap: new THREE.TextureLoader().load('../images/tile_normal.png')
    });

    boxGeometry = new THREE.BoxGeometry(1, 1, 1);

    textures.forEach(function (textureName, index) {
        boxMaterials[index] = createTextureMaterial(textureName);
    });

    hoverBoxMaterial = new THREE.MeshBasicMaterial({
        color: 'black',
        transparent: true,
        opacity: 0.3
    });
    hoverBox = new THREE.Mesh(boxGeometry, hoverBoxMaterial);

    planeCenter = new THREE.Vector3(Math.ceil(planeSize / 2), 0, Math.ceil(planeSize / 2));
    planeCenterTarget = new THREE.Object3D();
    planeCenterTarget.position.set(planeCenter.x, -1, planeCenter.z);

    deltaPoint = new THREE.Vector2();
    worldRot = new THREE.Quaternion();

    mainGroup = new THREE.Group();
    rotationGroup = new THREE.Group();
    rotationGroup.add(mainGroup);
    rotationGroup.add(hoverBox);
}

var createTextureMaterial = function (textureName) {
    var loader;
    var normStr = '_normal.png';
    var texture, normal, normalName;

    if (textureName instanceof Array) {
        loader = new THREE.CubeTextureLoader();
        textureName.forEach(function (currentTexture, index) {
            normalName[index] = currentTexture.slice(0, currentTexture.indexOf('.') + normStr);
        });
    } else {
        loader = new THREE.TextureLoader();
        normalName = textureName.slice(0, textureName.indexOf('.')) + normStr;
    }

    loader.setPath('https://aguba.github.io/GraphicsFinal/images/');

    var texture = loader.load(textureName);
    var normal = loader.load(normalName);
    var material = new THREE.MeshStandardMaterial({
        map: texture,
        normalMap: normal,
        metalness: 0,
        roughness: 0.2,
        transparent: true
    });

    return material;
}

var degrees = function (angle) {
    return angle * Math.PI / 180;
}

var createBox = function (boxType) {
    var box;
    switch (boxType) {
        case 'block':
            var newBox = new THREE.Mesh(boxGeometry, boxMaterials[boxMaterialIndex]);
            newBox.castShadow = true;
            newBox.receiveShadow = true;
            newBox.name = "block";

            box = newBox;
            break;

        case 'torch':
            var torchGeo = new THREE.CylinderGeometry(0.125, 0.0625, 0.5);
            var torchMat = new THREE.MeshStandardMaterial({
                transparent: true, color: 'burlywood',
                metalness: 0, roughness: 1
            });
            var torch = new THREE.Mesh(torchGeo, torchMat);
            torch.position.set(0, -0.25, 0);

            var sphereGeo = new THREE.SphereGeometry(0.125);
            var sphereMat = new THREE.MeshBasicMaterial({ color: 'darkorange' });
            var sphere = new THREE.Mesh(sphereGeo, sphereMat);
            sphere.position.set(0, 0.5, 0);
            torch.add(sphere);

            var pointLight = new THREE.PointLight('darkorange');
            pointLight.intensity = 0.5;
            pointLight.distance = 5;
            pointLight.castShadow = true;
            torch.add(pointLight);

            var torchBoxMat = new THREE.MeshBasicMaterial({
                transparent: true,
                opacity: 0
            });
            var torchBox = new THREE.Mesh(boxGeometry, torchBoxMat);
            torchBox.name = 'torch';
            torchBox.add(torch);

            box = torchBox;
            break;
    }
    return box;
}

var planeBuilder = function (x, y) {
    for (var i = 1; i <= x; i++) {
        for (var j = 1; j <= y; j++) {
            var plane = new THREE.Mesh(planeGeometry, planeMaterial);
            plane.position.set(i - planeCenter.x, -0.5, j - planeCenter.z);
            plane.rotation.x = Math.PI * -90 / 180;
            plane.receiveShadow = true;
            plane.name = "plane";
            mainGroup.add(plane);
        }
    }
}

var getMouseClicked = function (event) {
    var isRightClick;

    if ("which" in event) {
        isRightClick = (event.which == 3);
    } else if ("button" in event) {
        isRightClick = (event.button == 2);
    }

    return isRightClick;
}

var setRotation = function (rotationX, rotationY, sensitivity) {
    worldRot.setFromAxisAngle(new THREE.Vector3(1, 0, 0), rotationY * degrees(sensitivity));
    rotationGroup.quaternion.premultiply(worldRot);
    worldRot.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -rotationY * degrees(sensitivity));
    rotationGroup.quaternion.premultiply(worldRot);

    rotationGroup.rotateY(rotationX * degrees(100));
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    var intersect = raycaster.intersectObjects(mainGroup.children)[0];

    if (intersect) {
        positionBox(hoverBox, intersect);
        console.log(intersect.face.normal);
        console.log(intersect.object.name);
    }

    if (leftClicked) {
        isDragging = true;
        var deltaX = mouse.x - deltaPoint.x;
        var deltaY = mouse.y - deltaPoint.y;

        setRotation(deltaX, deltaY, 100);
        deltaPoint.set(mouse.x, mouse.y);
    }
}

function onMouseDown(event) {
    rightClicked = getMouseClicked(event);
    leftClicked = !rightClicked;
    deltaPoint.set(mouse.x, mouse.y);
}

function onMouseUp(event) {
    var intersect = raycaster.intersectObjects(mainGroup.children)[0];
    var obj;

    console.log(intersect);
    console.log(isDragging);

    if (isDragging || !intersect) {
        leftClicked = false;
        rightClicked = false;
        isDragging = false;

        return;
    }

    obj = intersect.object;


    if (rightClicked) {
        if (obj.name != "plane") {
            mainGroup.remove(obj);
        }
    } else if (obj.name != 'torch') {
        var newBox = createBox(boxType);

        positionBox(newBox, intersect);
        mainGroup.add(newBox);
    }

    leftClicked = false;
    rightClicked = false;
    isDragging = false;
}

var positionBox = function (box, intersect) {
    var obj = intersect.object;

    if (obj.name == "plane") {
        box.position.set(obj.position.x, 0, obj.position.z);
    } else if (obj.name == "block") {
        var normal = intersect.face.normal;
        var child = box.children[0];
        console.log(child);

        var angle = degrees(45);
        var mod = 1;

        if (box.name == 'torch') {
            mod = 0.75;
            if (normal.y == -1) {
                box.rotation.set(degrees(180), 0, 0);
            } else {
                box.children[0].rotation.set(angle * normal.z, 0, angle * -normal.x);
            }
        }

        box.position.set(
            obj.position.x + normal.x * mod,
            obj.position.y + normal.y,
            obj.position.z + normal.z * mod);
    }
}
