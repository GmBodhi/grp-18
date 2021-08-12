// @ts-check
import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import GUI from "tweakpane";
//Safety wrapper

(() => {
  let canvas,
    scene,
    camera,
    root,
    end,
    models = [],
    renderer,
    labelRenderer,
    xmlhttp,
    processing = [],
    lonePair,
    focused = { model: 1 },
    labels = [];

  // Debug
  let gui = new GUI({
    title: "GUI",
    expanded: false,
  });
  // @ts-ignore
  gui.containerElem_.style.zIndex = "1";

  // Sizes
  const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  // Canvas
  canvas = document.querySelector("canvas.webgl");

  // Scene
  scene = new THREE.Scene();

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
  let geometry = new THREE.PlaneGeometry(1000, 1000);
  let material = new THREE.MeshPhongMaterial({
    color: 0x2b2b2b,
    depthWrite: false,
  });

  let ground = new THREE.Mesh(geometry, material);
  ground.position.set(0, -3, 0);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  let grid = new THREE.GridHelper(1000, 500, 0x000000, 0x000000);
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

  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = "absolute";
  labelRenderer.domElement.style.top = "0px";
  document.body.appendChild(labelRenderer.domElement);

  let controls = new OrbitControls(camera, labelRenderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxDistance = 100;
  controls.minDistance = 5;

  let autorotate = { autoRotate: true };
  gui.addInput(autorotate, "autoRotate").on("change", (e) => {
    controls.autoRotate = e.value;
    autorotate.autoRotate = e.value;
  });
  controls.autoRotate = true;
  autorotate.autoRotate = true;

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
    if (end) return renderer.dispose();
    controls.update();

    // Render
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);

    // Call animate again on the next frame
    window.requestAnimationFrame(animate);
  };

  animate();

  const addLonePair = async (pos1, pos2, root) => {
    console.log("Adding lone pair");
    if (!lonePair) return setTimeout(() => addLonePair(pos1, pos2, root), 10);
    console.log("Added");
    let lone = lonePair.clone();
    lone.position.set(pos2.x, pos2.y, pos2.z);
    lone.lookAt(pos1);
    lone.rotateX(Math.PI / 2);
    root.add(lone);
  };

  const addSingleBond = (data1, data2, root) => {
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

  const addDoubleBond = (data1, data2, root) => {
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

  const addTripleBond = (data1, data2, root) => {
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
    obj3.position.x -= 0.08;
    let grp = new THREE.Group();
    grp.add(obj1, obj2, obj3);
    grp.position.set(
      (data1.x + data2.x) / 2,
      (data1.y + data2.y) / 2,
      (data1.z + data2.z) / 2
    );
    grp.lookAt(data2);
    // grp.rotateZ((Math.PI * 3) / 4);
    root.add(grp);
  };

  const addSphere = (data, root) => {
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

  const load = (data, i) => {
    root = new THREE.Group();
    scene.add(root);
    root.position.set(15 * i, i * 15, 0);
    models.push(root);
    if (!data) throw new Error("Data not found..!");
    data.forEach((e) => {
      addSphere(e, root);
      data.forEach((m) => {
        let index = m.targets?.findIndex((a) => a.ref == e.uid);
        let deli = e.targets?.findIndex((a) => a.ref == m.uid);
        m.lonePairs?.forEach((e) => {
          addLonePair(
            new THREE.Vector3(m.position[0], m.position[1], m.position[2]),
            new THREE.Vector3(e[0], e[1], e[2]),
            root
          );
        });

        if (
          ![undefined, null, -1].includes(index) &&
          ![undefined, null, -1].includes(deli)
        ) {
          if (m.targets[index].type == "double") {
            addDoubleBond(
              new THREE.Vector3(e.position[0], e.position[1], e.position[2]),
              new THREE.Vector3(m.position[0], m.position[1], m.position[2]),
              root
            );
            m.targets.splice(index, 1);
            e.targets.splice(deli, 1);
          } else if (m.targets[index].type == "triple") {
            addTripleBond(
              new THREE.Vector3(e.position[0], e.position[1], e.position[2]),
              new THREE.Vector3(m.position[0], m.position[1], m.position[2]),
              root
            );
            m.targets.splice(index, 1);
            e.targets.splice(deli, 1);
          } else {
            addSingleBond(
              new THREE.Vector3(e.position[0], e.position[1], e.position[2]),
              new THREE.Vector3(m.position[0], m.position[1], m.position[2]),
              root
            );
            m.targets.splice(index, 1);
            e.targets.splice(deli, 1);
          }
        }
      });
    });
    controls.autoRotate = autorotate.autoRotate;
  };
  window.addEventListener("keydown", (e) => {
    if (e.code === "ArrowRight") {
      if (focused.model !== 8)
        return Focus(models[++focused.model - 1].position);
      else return;
    } else if (e.code === "ArrowLeft") {
      if (focused.model !== 1)
        return Focus(models[--focused.model - 1].position);
      else return;
    } else if (e.code === "Escape") {
      controls.autoRotate = !controls.autoRotate;
    }
  });

  // loader
  (() => {
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    loader.setDRACOLoader(dracoLoader);

    loader.load("/test.glb", function (gltf) {
      gltf.scene.scale.set(0.3, 0.3, 0.3);
      lonePair = gltf.scene;
    });
  })();

  // load json
  (() => {
    if (window.XMLHttpRequest) {
      xmlhttp = new XMLHttpRequest();
    } else {
      /* eslint-disable no-undef */
      xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
      if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
        labels.forEach((e) => e.remove());
        const data = JSON.parse(xmlhttp.response);
        data.data.forEach((e, i) => load(e, i));
        Focus(models[0].position);
      }
    };
    xmlhttp.open("GET", "/data.json", true);
    xmlhttp.send();
  })();

  // gui stuff
  gui
    .addInput(focused, "model", {
      options: { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8 },
    })
    .on("change", ({ value }) => {
      Focus(models[value - 1].position);
    });

  gui.addButton({ title: "Troubleshoot" }).on("click", () => {
    end = true;
    setTimeout(() => {
      end = false;
      controls.reset();
      animate();
    }, 1000);
  });
  gui.addButton({ title: "Kill" }).on("click", () => {
    scene.clear();
    labels.forEach((e) => e.remove());
  });

  // Focus
  const Focus = (pos, process) => {
    if (!process) {
      processing.length = 0;
      process = Math.random();
      processing.push(process);
    } else if (!processing.includes(process)) return;

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
    if (Math.abs(camera.position.x - x) > 0.1) {
      let _temp = (x - camera.position.x) / 10;
      camera.position.x += _temp;
    }
    if (Math.abs(camera.position.y - y) > 0.1) {
      let _temp = (y - camera.position.y) / 10;
      camera.position.y += _temp;
    }
    if (Math.abs(camera.position.z - z) > 0.1) {
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
        Math.abs(camera.position.x - x) < 0.1 &&
        Math.abs(camera.position.y - y) < 0.1 &&
        Math.abs(camera.position.z - z) < 0.1
      )
    ) {
      requestAnimationFrame(() => Focus(pos, process));
    }
  };
})();
