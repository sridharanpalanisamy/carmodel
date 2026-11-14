"use client";

import { useEffect, useRef, useState } from "react";

export default function FordGLBViewer() {
  const hostRef = useRef(null);
  const [status, setStatus] = useState("Loading the local Ford Model T 3D model…");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let renderer;
    let frame = 0;
    let controls;
    let resizeObserver;
    let disposed = false;
    let modelRoot;
    let resetView;

    async function start() {
      try {
        const THREE = await import("three");
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
        const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
        if (disposed || !hostRef.current) return;

        const host = hostRef.current;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color("#e7e6e3");
        const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 1000);
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.domElement.setAttribute("aria-label", "Interactive real 3D Ford Model T vehicle model");
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        renderer.domElement.style.display = "block";
        host.appendChild(renderer.domElement);

        scene.add(new THREE.HemisphereLight(0xffffff, 0x77736b, 2.0));
        const key = new THREE.DirectionalLight(0xffffff, 3.0);
        key.position.set(5, 8, 6);
        key.castShadow = true;
        key.shadow.mapSize.set(2048, 2048);
        scene.add(key);
        const fill = new THREE.DirectionalLight(0xffffff, 1.15);
        fill.position.set(-5, 3, -4);
        scene.add(fill);

        const floor = new THREE.Mesh(
          new THREE.PlaneGeometry(200, 200),
          new THREE.MeshStandardMaterial({ color: "#d1cfca", roughness: 0.92, metalness: 0 })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.015;
        floor.receiveShadow = true;
        scene.add(floor);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.065;
        controls.enablePan = true;
        controls.minPolarAngle = 0.12;
        controls.maxPolarAngle = Math.PI * 0.49;

        const loader = new GLTFLoader();
        loader.load(
          "/carmodel/models/ford-model-t.glb",
          (gltf) => {
            if (disposed) return;
            modelRoot = gltf.scene;
            modelRoot.traverse((object) => {
              if (object.isMesh) {
                object.castShadow = true;
                object.receiveShadow = true;
                if (object.material) {
                  const materials = Array.isArray(object.material) ? object.material : [object.material];
                  materials.forEach((material) => {
                    if (material.map) material.map.colorSpace = THREE.SRGBColorSpace;
                    material.needsUpdate = true;
                  });
                }
              }
            });
            const bounds = new THREE.Box3().setFromObject(modelRoot);
            const size = bounds.getSize(new THREE.Vector3());
            const center = bounds.getCenter(new THREE.Vector3());
            modelRoot.position.sub(center);
            scene.add(modelRoot);

            const maxDimension = Math.max(size.x, size.y, size.z) || 1;
            const distance = maxDimension * 2.15;
            camera.position.set(distance * 1.25, distance * 0.72, distance * 1.45);
            camera.near = Math.max(maxDimension / 1000, 0.001);
            camera.far = maxDimension * 100;
            camera.updateProjectionMatrix();
            controls.target.set(0, 0, 0);
            controls.minDistance = maxDimension * 0.85;
            controls.maxDistance = maxDimension * 7;
            controls.update();
            resetView = () => {
              camera.position.set(distance * 1.25, distance * 0.72, distance * 1.45);
              controls.target.set(0, 0, 0);
              controls.update();
            };
            setStatus("Real Ford Model T mesh · drag to rotate · scroll to zoom");
          },
          undefined,
          (error) => {
            console.error("Unable to load local Ford Model T GLB:", error);
            if (!disposed) {
              setFailed(true);
              setStatus("The local 3D model could not be loaded. Please refresh and try again.");
            }
          }
        );

        const resize = () => {
          if (!hostRef.current || !renderer) return;
          const width = Math.max(host.clientWidth, 1);
          const height = Math.max(host.clientHeight, 1);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height, false);
        };
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(host);
        resize();

        const animate = () => {
          if (disposed) return;
          frame = requestAnimationFrame(animate);
          controls?.update();
          renderer?.render(scene, camera);
        };
        animate();

        host.dataset.viewerReady = "true";
      } catch (error) {
        console.error("Unable to initialize the Ford Model T viewer:", error);
        if (!disposed) {
          setFailed(true);
          setStatus("3D viewer initialization failed in this browser.");
        }
      }
    }

    start();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      controls?.dispose();
      if (renderer) {
        renderer.dispose();
        renderer.domElement.remove();
      }
    };
  }, []);

  return (
    <div className="ford-glb-viewer">
      <div ref={hostRef} className="ford-glb-stage" />
      <div className="ford-glb-status" role="status">{status}</div>
      {failed && <p className="ford-glb-help">Check your internet connection and reload the page. The 3D asset is served from this project, not an external 360° service.</p>}
    </div>
  );
}
