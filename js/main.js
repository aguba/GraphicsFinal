var scene, camera, renderer;
var interval = 1;
var aspectRatio = window.innerWidth / window.innerHeight;

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

var planeGeometry = new THREE.PlaneGeometry(1, 1);
var planeMaterial = new THREE.MeshStandardMaterial({ 
    metalness: 0,
    roughness: 0.2,
    map: new THREE.TextureLoader().load('/images/tile.jpg'),
    normalMap: new THREE.TextureLoader().load('/images/tile_normal.jpg') });

var boxIsIrregular = false;
var boxGeometry = new THREE.BoxGeometry(1, 1, 1);
var boxMaterial = new THREE.MeshStandardMaterial({ 
    metalness: 0,
    roughness: 0.2,
    map: new THREE.TextureLoader().load('/images/tile.jpg'),
    normalMap: new THREE.TextureLoader().load('/images/tile_normal.jpg') });

var boxMaterials = [];
var boxMaterialIndex = 0;
var textures = ['tile', 'brick'];
textures.forEach(function(textureName, index){
    var loader = new THREE.TextureLoader();
    boxMaterial.map = loader.load('/images/' + textureName + '.jpg');
    boxMaterial.normalMap = loader.load('/images/' + textureName + '_normal.jpg');
    boxMaterial.needsUpdate = true;
    boxMaterials[index] = boxMaterial.clone();
});

var hoverBoxMaterial = new THREE.MeshBasicMaterial({
    color: 'black',
    transparent: true,
    opacity: 0.3
});
var hoverBox = new THREE.Mesh(boxGeometry, hoverBoxMaterial);

var planeSize = 25;
var fov = 20;
var orthoWidth = (planeSize / 2) * aspectRatio;
var orthoHeight = planeSize / 2;
var planeCenter = new THREE.Vector3(Math.ceil(planeSize / 2), 0, Math.ceil(planeSize / 2));
var planeCenterTarget = new THREE.Object3D();
planeCenterTarget.position.set(planeCenter.x, -1, planeCenter.z);

var leftClicked;
var rightClicked;
var isDragging;
var deltaPoint = new THREE.Vector2();
var worldRot = new THREE.Quaternion();

var mainGroup = new THREE.Group();
var rotationGroup = new THREE.Group();
rotationGroup.add(mainGroup);
rotationGroup.add(hoverBox);

window.onload = function () {

    document.getElementById('btnTileTexture').onclick = function(){
        boxMaterialIndex = 0;
    }

    document.getElementById('btnBrickTexture').onclick = function(){
        boxMaterialIndex = 1;
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

    var rectGeo = new THREE.BoxGeometry(0.125, 0.5, 0.125);
    var rectMesh = new THREE.Mesh(rectGeo, boxMaterial);
    rectMesh.position.set(0, -0.25, 0);
    mainGroup.add(rectMesh);

    var pointLight = new THREE.PointLight();
    pointLight.intensity = 0.5;
    pointLight.castShadow = true;
    mainGroup.add(pointLight);

    var lightHelp = new THREE.PointLightHelper(pointLight, 0.3);
    mainGroup.add(lightHelp);

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

var degrees = function (angle) {
    return angle * Math.PI / 180;
}

var createBox = function (boxIsIrregular) {
    var newBox = new THREE.Mesh(boxGeometry, boxMaterials[boxMaterialIndex]);
    newBox.castShadow = true;
    newBox.receiveShadow = true;
    newBox.name = "box";

    return newBox;
}

var planeBuilder = function (x, y) {
    for (var i = 1; i <= x; i++) {
        for (var j = 1; j <= y; j++) {
            var plane = new THREE.Mesh(planeGeometry, planeMaterial);
            plane.position.set(i - planeCenter.x, -0.5, j - planeCenter.z);
            // plane.position.x = i - planeCenter.x;
            // plane.position.z = j - planeCenter.z;
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
    var intersect = raycaster.intersectObjects(mainGroup.children, true)[0];
    // console.log(intersects[0].object.name);
    // console.log(intersects[0].faceIndex);

    if(intersect){
        positionBox(hoverBox, intersect);
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
    var intersect = raycaster.intersectObjects(mainGroup.children, true)[0];
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
        if (obj.name == "box") {
            mainGroup.remove(obj);
        }
    } else {
        var newBox = createBox();

        // if (obj.name == "plane") {
        //     newBox.position.set(obj.position.x, 0, obj.position.z);
        // } else if (obj.name == "box") {
        //     positionBox(newBox, intersect);
        // }
        positionBox(newBox, intersect);
        mainGroup.add(newBox);
    }

    leftClicked = false;
    rightClicked = false;
    isDragging = false;
}

var positionBox = function (box, intersect) {
    var obj = intersect.object;

    if (obj.name == "plane"){
        box.position.set(obj.position.x, 0, obj.position.z);
    } else if (obj.name == "box") {
        switch (intersect.faceIndex) {
            case 0:
            case 1:
                box.position.set(obj.position.x + 1, obj.position.y, obj.position.z);
                break;

            case 2:
            case 3:
                box.position.set(obj.position.x - 1, obj.position.y, obj.position.z);
                break;

            case 4:
            case 5:
                box.position.set(obj.position.x, obj.position.y + 1, obj.position.z);
                break;

            case 6:
            case 7:
                box.position.set(obj.position.x, obj.position.y - 1, obj.position.z);
                break;

            case 8:
            case 9:
                box.position.set(obj.position.x, obj.position.y, obj.position.z + 1);
                break;

            case 10:
            case 11:
                box.position.set(obj.position.x, obj.position.y, obj.position.z - 1);
                break;
        }
    }
}