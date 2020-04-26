
// essentials
var gui = new dat.GUI();
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 1, 1000000 );
var renderer = new THREE.WebGLRenderer({ antialias: true });
var spriteMap = new THREE.TextureLoader().load("assets/circle-64.png" );

renderer.setSize( window.innerWidth, window.innerHeight );
renderer.gammaInput = true;
renderer.gammaOutput = true;
document.body.appendChild( renderer.domElement );



// dat.gui
var controls = new function() {
    this.ambientLight = 0xffffff;
    this.fogColor = 0xeb2df7;
    this.fogDensity = 0.3; //  dividing by 100000
    this.terrainEmissiveColor = 0x000000;
    this.terrainBaseColor = 0x000000;
    this.wireframeEmissiveColor = 0x00aaff;
    this.wireframeColor = 0x000000;
    this.showWireframe = true;
    this.showBaseTerrain = true;
    this.pathWidth = 3;
    this.elevate = 500;
    this.baseHeight = 3000;
    this.amplitude = 0.1;
    this.speed = 1;
};

var general = gui.addFolder('Outrun | Mohit Hingorani');
general.addColor(controls, 'ambientLight').name('Ambient Light');

general.addColor(controls, 'fogColor').name('Fog Color');
general.add(controls, 'fogDensity',0,1).name('Fog Density');

var meshFolder = gui.addFolder('Mesh');
meshFolder.add(controls, 'showBaseTerrain').name('Show Base Terrain');
meshFolder.addColor(controls, 'terrainEmissiveColor').name('Terrain Emissive Color');
meshFolder.addColor(controls, 'terrainBaseColor').name('Terrain Color');

meshFolder.add(controls, 'showWireframe').name('Show Wireframe');
meshFolder.addColor(controls, 'wireframeEmissiveColor').name('Wire Emissive Color');
meshFolder.addColor(controls, 'wireframeColor').name('Wireframe Color');

meshFolder.add(controls, 'pathWidth',0,25).name('Path Width');
meshFolder.add(controls, 'elevate', 1, 1000).name('Hill Height');
meshFolder.add(controls, 'baseHeight', 0, 10000).name('Plain Height');

var animationFolder = gui.addFolder('Animation Folder');
animationFolder.add(controls, 'amplitude', 0,1).name('Amplitude');
animationFolder.add(controls, 'speed', 1, 10).name('Speed');

general.open();
meshFolder.open();

// initlaize lights
var ambientLight = new THREE.AmbientLight(controls.ambientLight);
scene.add( ambientLight );

// intialize three
var segments = 1000;
var w = 40000;
var h = 80000;
var ws = w/segments;
var hs = h/segments;

var trackBallControls = new THREE.TrackballControls( camera, renderer.domElement );
var perlin = new THREE.ImprovedNoise();
const loader = new THREE.TextureLoader();
const skyBoxTexture = loader.load('assets/outrun.jpg');
var clock = new THREE.Clock();
var distantFog = new THREE.FogExp2( controls.fogColor, controls.fogDensity/10000 );
var terrainGeometry = new THREE.PlaneGeometry( w,h,ws-1,hs-1); // - 1 since it uses segments - keeps the math straight

terrainGeometry.rotateX( - Math.PI / 2 );
terrainGeometry.translate(-(w/ws)/2,0, 0);

var terrainMaterial = new THREE.MeshPhongMaterial( { color: controls.terrainBaseColor, emissive: controls.terrainEmissiveColor, side: THREE.DoubleSide, transparent: true } ) 
var wireframeMaterial = new THREE.MeshPhongMaterial( { color: controls.wireframeColor, emissive: controls.wireframeEmissiveColor, wireframe: true } )

function attenuate (i) {
    var position = Math.abs((i%ws) - ws/2);
    var positionWithPath = Math.max(0,position-controls.pathWidth);
    var height = positionWithPath * controls.elevate;
    return height;
}

var baseTerrainMesh = new THREE.Mesh( terrainGeometry, terrainMaterial );
var wireframeTerrainMesh = new THREE.Mesh( terrainGeometry, wireframeMaterial );

// var quadGeoemetry = terrainGeometry.clone();

// var lineSegementMeshes = [];
// var lineGeometries  = [];
// var lineGroup = new THREE.Group();
// var lineMaterial = new THREE.LineBasicMaterial({color: '#00ffff', linewidth: 1});

// for (var i = 0; i < terrainGeometry.vertices.length; i+=ws) {
    //     var tempGeometry = new THREE.Geometry();
    //     var tempVertexArray = terrainGeometry.vertices.slice(i, i + ws);
    //     tempGeometry.vertices = tempVertexArray;
    //     tempGeometry.name = i;
    
    //     lineGeometries.push(tempGeometry);
    // }
    
    // console.log(lineGeometries);
    
    // for ( var i = 0 ; i < lineGeometries.length; i++ ){
        //     lineSegementMeshes.push(new THREE.Line( lineGeometries[i], lineMaterial ))
        //     lineSegementMeshes.position =  new THREE.Vector3(100,100,100);
        //     lineGroup.add(lineSegementMeshes[i]);
        // }
        
        
        // terrainGeometry.verticesNeedUpdate = true;
        // console.log('vertex',vertex);
        // camera.lookAt(new THREE.Vector3(0,0,0));
        
init();
animate();

function init(){
    
    // terrainGeometry.translate(0,0,-1000);
    // terrainGeometry.rotateX( - Math.PI / 2.3);
    // camera.position.z = 1000;
    // camera.position.set(0,400,5000);

    camera.position.set(0,0,5000);
    
    trackBallControls.rotateSpeed = 5;
    trackBallControls.zoomSpeed = 2;

    
    scene.add(wireframeTerrainMesh);
    scene.add( baseTerrainMesh );
    
}

function animate() {
    requestAnimationFrame(animate);
    
    distantFog.color.setHex(controls.fogColor);
    distantFog.density = controls.fogDensity/10000;

    ambientLight.color.setHex(controls.ambientLight);
    terrainMaterial.color.setHex(controls.terrainBaseColor);
    terrainMaterial.emissive.setHex(controls.terrainEmissiveColor);
    
    wireframeMaterial.color.setHex(controls.wireframeColor) ;
    wireframeMaterial.emissive.setHex(controls.wireframeEmissiveColor);
    
    var delta = clock.getDelta();
    var time = clock.getElapsedTime();
    
    for (let i = 0 ; i < terrainGeometry.vertices.length ; i++ ) {
        var x = i % ws
        var y = (parseInt(i/ws))/hs;
        terrainGeometry.vertices[i].y = (Math.abs(perlin.noise(x,y,i))+ controls.amplitude * Math.sin((time + i)/controls.speed)) * attenuate(i) - controls.baseHeight;
    }
    terrainGeometry.verticesNeedUpdate = true;
    
    trackBallControls.update(delta);
    render();
};

function render() { 
    scene.background = skyBoxTexture;
    scene.fog = distantFog;

    baseTerrainMesh.visible = controls.showBaseTerrain;
    wireframeTerrainMesh.visible =controls.showWireframe;

    // camera.position.setX(100);
    // camera.lookAt.setX(100);
    // console.log(camera.position);
    renderer.render( scene, camera );
}

window.addEventListener( 'resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );

}, false );

