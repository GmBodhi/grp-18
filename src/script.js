// @ts-check
import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls.js";
import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/examples/jsm/renderers/CSS2DRenderer.js";
import GUI from "tweakpane";
//Safety wrapper

(() => {
  let canvas,
    scene,
    camera,
    root,
    control,
    renderer,
    labelRenderer,
    xmlhttp,
    labels = [];

  // Debug
  let gui = new GUI({
    title: "GUI",
    expanded: true,
  });
  // @ts-ignore
  gui.containerElem_.style.zIndex = "1";

  // Sizes
  const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  root = new THREE.Group();

  // Canvas
  canvas = document.querySelector("canvas.webgl");

  // Scene
  scene = new THREE.Scene();

  scene.add(root);

  // Lights
  const pointLight = new THREE.DirectionalLight(0xffffff, 0.5);
  pointLight.position.set(0, 1, 0);
  scene.add(pointLight);

  //ambient light
  const light = new THREE.AmbientLight(0x404040, 1); // soft white light
  scene.add(light);

  // Camera
  camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 1, 1000);
  camera.position.set(10, 3, 10);
  scene.add(camera);

  //Grid
  let geometry = new THREE.PlaneGeometry(500, 500);
  let material = new THREE.MeshPhongMaterial({
    color: 0x2b2b2b,
    depthWrite: false,
  });

  let ground = new THREE.Mesh(geometry, material);
  ground.position.set(0, -3, 0);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  let grid = new THREE.GridHelper(500, 100, 0x000000, 0x000000);
  grid.position.y = -3;
  // @ts-ignore
  grid.material.fog = false;
  // @ts-ignore
  grid.material.transparent = true;
  scene.add(grid);

  //Fog
  scene.fog = new THREE.FogExp2(0x404040, 0.008);
  scene.background = new THREE.Color(0x2b2b2b);

  // Renderer
  renderer = new THREE.WebGLRenderer({
    // @ts-ignore
    canvas: canvas,
  });
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  control = new TrackballControls(camera, renderer.domElement);

  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = "absolute";
  labelRenderer.domElement.style.top = "0px";
  document.body.appendChild(labelRenderer.domElement);

  let controls = new OrbitControls(camera, labelRenderer.domElement);
  controls.enableDamping = true;
  controls.maxDistance = 100;
  controls.minDistance = 5;

  let autorotate = { autoRotate: true };
  gui.addInput(autorotate, "autoRotate").on("change", (e) => {
    controls.autoRotate = e.value;
    autorotate.autoRotate = e.value;
  });
  controls.autoRotate = true;
  autorotate.autoRotate = true;

  // gui.addInput(pointLight.position, 'x')
  // gui.addInput(pointLight.position, 'y')
  // gui.addInput(pointLight.position, 'z')

  window.addEventListener("resize", () => {
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
  });

  const animate = () => {
    // Update objects
    // if (autorotate.autoRotate){
    //     root.rotation.y += .001
    //     root.rotation.x += .005
    // }

    // Update Orbital Controls
    controls.update();

    // Render
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);

    // Call animate again on the next frame
    window.requestAnimationFrame(animate);
  };

  animate();

  const addSingleBond = (data1, data2) => {
    let distance = data1.distanceTo(data2);
    let geometry = new THREE.CylinderGeometry(0.05, 0.05, distance);
    let material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(0xffffff),
    });
    let obj = new THREE.Mesh(geometry, material);
    obj.rotateX(Math.PI / 2);
    let grp = new THREE.Group();
    grp.position.set(
      (data1.x + data2.x) / 2,
      (data1.y + data2.y) / 2,
      (data1.z + data2.z) / 2
    );
    grp.add(obj);
    grp.lookAt(data2);
    root.add(grp);
  };

  const addDoubleBond = (data1, data2) => {
    let distance = data1.distanceTo(data2);
    let geometry = new THREE.CylinderGeometry(0.042, 0.042, distance);
    let material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(0xffffff),
    });
    let obj1 = new THREE.Mesh(geometry, material);
    let obj2 = new THREE.Mesh(geometry, material);
    obj1.rotateX(Math.PI / 2);
    obj2.rotateX(Math.PI / 2);
    obj1.position.x += 0.05;
    obj2.position.x -= 0.05;
    let grp = new THREE.Group();
    grp.add(obj1, obj2);
    grp.position.set(
      (data1.x + data2.x) / 2,
      (data1.y + data2.y) / 2,
      (data1.z + data2.z) / 2
    );
    grp.lookAt(data2);
    root.add(grp);
  };

  const addTripleBond = (data1, data2) => {
    let distance = data1.distanceTo(data2);
    let geometry = new THREE.CylinderGeometry(0.039, 0.039, distance);
    let material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(0xffffff),
    });
    let obj1 = new THREE.Mesh(geometry, material);
    let obj2 = new THREE.Mesh(geometry, material);
    let obj3 = new THREE.Mesh(geometry, material);
    obj1.rotateX(Math.PI / 2);
    obj2.rotateX(Math.PI / 2);
    obj3.rotateX(Math.PI / 2);
    obj1.position.x += 0.08;
    obj3.position.x += 0.08;
    let grp = new THREE.Group();
    grp.add(obj1, obj2, obj3);
    grp.position.set(
      (data1.x + data2.x) / 2,
      (data1.y + data2.y) / 2,
      (data1.z + data2.z) / 2
    );
    grp.lookAt(data2);
    root.add(grp);
  };

  const addSphere = (data) => {
    let geometry = new THREE.SphereGeometry(data.radius, 64, 64);
    let material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(data.color),
    });
    let obj = new THREE.Mesh(geometry, material);
    obj.position.set(data.position[0], data.position[1], data.position[2]);
    root.add(obj);
    const label = document.createElement("div");
    label.className = "label";
    label.style.color = "#ffffff";
    label.textContent = data.name;
    obj.add(new CSS2DObject(label));
    labels.push(label);
  };

  const load = (data) => {
    if (!data) throw new Error("Data not found..!");
    data.forEach((e) => {
      addSphere(e);
      data.forEach((m) => {
        let index = m.targets?.findIndex((a) => a.ref == e.uid);
        let deli = e.targets?.findIndex((a) => a.ref == m.uid);

        if (
          ![undefined, null, -1].includes(index) &&
          ![undefined, null, -1].includes(deli)
        ) {
          if (m.targets[index].type == "double") {
            addDoubleBond(
              new THREE.Vector3(e.position[0], e.position[1], e.position[2]),
              new THREE.Vector3(m.position[0], m.position[1], m.position[2])
            );
            m.targets.splice(index, 1);
            e.targets.splice(deli, 1);
          } else if (m.targets[index].type == "triple") {
            addTripleBond(
              new THREE.Vector3(e.position[0], e.position[1], e.position[2]),
              new THREE.Vector3(m.position[0], m.position[1], m.position[2])
            );
            m.targets.splice(index, 1);
            e.targets.splice(deli, 1);
          } else {
            addSingleBond(
              new THREE.Vector3(e.position[0], e.position[1], e.position[2]),
              new THREE.Vector3(m.position[0], m.position[1], m.position[2])
            );
            m.targets.splice(index, 1);
            e.targets.splice(deli, 1);
          }
        }
      });
    });
    controls.autoRotate = autorotate.autoRotate;
  };
  (() => {
    if (window.XMLHttpRequest) {
      xmlhttp = new XMLHttpRequest();
    } else {
      xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
      if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
        root.clear();
        labels.forEach((e) => e.remove());
        load(JSON.parse(xmlhttp.response));
      }
    };
    xmlhttp.open("GET", "/data.json", true);
    xmlhttp.send();
  })();
  gui
    .addButton({ title: "Auto-Center", label: "Auto-Center" })
    .on("click", () => {
      Focus(root.position);
    });

  // Focus
  const Focus = (pos) => {
    const { x, y, z } = pos;
    if (Math.abs(controls.target.x - x) > 0.0001) {
      let _temp = (x - controls.target.x) / 10;
      controls.target.x += _temp;
    }
    if (Math.abs(controls.target.y - y) > 0.0001) {
      let _temp = (y - controls.target.y) / 10;
      controls.target.y += _temp;
    }
    if (Math.abs(controls.target.z - z) > 0.0001) {
      let _temp = (z - controls.target.z) / 10;
      controls.target.z += _temp;
    }
    if (Math.abs(camera.position.x - x) > 0.0001) {
      let _temp = (x - camera.position.x) / 10;
      camera.position.x += _temp;
    }
    if (Math.abs(camera.position.y - y) > 0.0001) {
      let _temp = (y - camera.position.y) / 10;
      camera.position.y += _temp;
    }
    if (Math.abs(camera.position.z - z) > 0.0001) {
      let _temp = (z - camera.position.z) / 10;
      camera.position.z += _temp;
    }
    if (
      !(
        Math.abs(controls.target.x - x) < 0.0001 &&
        Math.abs(controls.target.y - y) < 0.0001 &&
        Math.abs(controls.target.z - z) < 0.0001
      ) &&
      !(
        Math.abs(camera.position.x - x) < 0.0001 &&
        Math.abs(camera.position.y - y) < 0.0001 &&
        Math.abs(camera.position.z - z) < 0.0001
      )
    ) {
      requestAnimationFrame(() => Focus(pos));
    }
  };
})();
