"use client";

import { useEffect, useRef, useState } from "react";

export default function FordGLBViewer({ modelPath = "/carmodel/models/ford-model-t.glb", modelName = "Ford Model T" }) {
  const hostRef = useRef(null);
  const [status, setStatus] = useState(`Loading the local ${modelName} 3D model…`);
  const [failed, setFailed] = useState(false);
  const resetViewRef = useRef(null);
  const controlsRef = useRef(null);
  const [modelReady, setModelReady] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    let renderer;
    let frame = 0;
    let controls;
    let resizeObserver;
    let disposed = false;
    let modelRoot;
    let fittedDistance = 0;
    let viewDirection;
    let resetView;
    let motionQuery;
    const modelRequest = new AbortController();
    const syncMotionPreference = (event) => {
      const reducedMotion = event.matches;
      setPrefersReducedMotion(reducedMotion);
      if (controls) {
        controls.autoRotate = !reducedMotion;
        setAutoRotate(!reducedMotion);
      }
    };

    async function start() {
      try {
        const THREE = await import("three");
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
        const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
        const { MeshoptDecoder } = await import("three/examples/jsm/libs/meshopt_decoder.module.js");
        if (disposed || !hostRef.current) return;

        const host = hostRef.current;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color("#e7e6e3");
        const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 1000);
        viewDirection = new THREE.Vector3(1.35, 0.38, 1.55).normalize();
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.domElement.setAttribute("aria-label", `Interactive real 3D ${modelName} vehicle model`);
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        renderer.domElement.style.display = "block";
        renderer.domElement.style.touchAction = "none";
        renderer.domElement.style.cursor = "grab";
        renderer.domElement.style.pointerEvents = "auto";
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
        const undersideFill = new THREE.DirectionalLight(0xffffff, 1.6);
        undersideFill.position.set(0, -5, 4);
        scene.add(undersideFill);


        controls = new OrbitControls(camera, renderer.domElement);
        controlsRef.current = controls;
        controls.enableDamping = true;
        motionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
        if (motionQuery) {
          syncMotionPreference(motionQuery);
          motionQuery.addEventListener?.("change", syncMotionPreference);
        } else {
          controls.autoRotate = true;
          setAutoRotate(true);
        }
        controls.autoRotateSpeed = 1.35;
        controls.enableKeys = true;
        controls.enableRotate = true;
        controls.enableZoom = true;
        controls.mouseButtons = {
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        };
        controls.dampingFactor = 0.065;
        controls.enablePan = true;
        controls.minPolarAngle = 0.12;
        // Allow a complete orbit, including below the vehicle. The old 88-degree
        // ceiling made an underside view physically unreachable by mouse/touch.
        controls.maxPolarAngle = Math.PI - 0.08;

        const loader = new GLTFLoader();
        // The Mustang GLB uses EXT_meshopt_compression; register its decoder before parse().
        loader.setMeshoptDecoder(MeshoptDecoder);
        const assetUrl = new URL(modelPath, window.location.href);
        setStatus(`Downloading local ${modelName} model…`);
        const response = await fetch(assetUrl.href, { cache: "no-cache", signal: modelRequest.signal });
        if (!response.ok) {
          throw new Error(`Model request failed: HTTP ${response.status} ${response.statusText} (${assetUrl.pathname})`);
        }
        let modelBuffer;
        const contentLength = Number(response.headers.get("content-length")) || 0;
        if (response.body?.getReader) {
          const reader = response.body.getReader();
          const chunks = [];
          let received = 0;
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            received += value.byteLength;
            if (!disposed) {
              const progress = contentLength > 0
                ? ` ${Math.min(99, Math.round((received / contentLength) * 100))}%`
                : ` ${(received / (1024 * 1024)).toFixed(1)} MB`;
              setStatus(`Downloading local ${modelName} model…${progress}`);
            }
          }
          const combined = new Uint8Array(received);
          let offset = 0;
          for (const chunk of chunks) {
            combined.set(chunk, offset);
            offset += chunk.byteLength;
          }
          modelBuffer = combined.buffer;
        } else {
          modelBuffer = await response.arrayBuffer();
        }
        if (disposed) return;
        setStatus(`Preparing ${modelName} 3D model…`);
        if (modelBuffer.byteLength < 20) {
          throw new Error(`Model response is unexpectedly small (${modelBuffer.byteLength} bytes).`);
        }
        const resourcePath = new URL(".", assetUrl).href;
        loader.parse(
          modelBuffer,
          resourcePath,
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
                    // Some source-model surfaces have reversed winding; render both sides so panels remain visible.
                    material.side = THREE.DoubleSide;
                    material.needsUpdate = true;
                  });
                }
              }
            });
            // Fit the loaded GLB from its world-space bounds. Some downloaded GLBs
            // carry a transformed scene root, so center a wrapper group rather than
            // assuming the model's root transform is identity.
            const modelGroup = new THREE.Group();
            modelGroup.add(modelRoot);
            scene.add(modelGroup);
            modelGroup.updateMatrixWorld(true);
            const bounds = new THREE.Box3().setFromObject(modelGroup);
            const size = bounds.getSize(new THREE.Vector3());
            const center = bounds.getCenter(new THREE.Vector3());
            modelGroup.position.sub(center);
            modelGroup.updateMatrixWorld(true);

            const maxDimension = Math.max(size.x, size.y, size.z);
            if (!Number.isFinite(maxDimension) || maxDimension <= 0) {
              throw new Error("The GLB contains no visible model geometry.");
            }
            const centeredBounds = new THREE.Box3().setFromObject(modelGroup);
            const fitCorners = [];
            for (const x of [centeredBounds.min.x, centeredBounds.max.x]) {
              for (const y of [centeredBounds.min.y, centeredBounds.max.y]) {
                for (const z of [centeredBounds.min.z, centeredBounds.max.z]) {
                  fitCorners.push(new THREE.Vector3(x, y, z));
                }
              }
            }
            const getFitDistance = () => {
              const verticalFov = THREE.MathUtils.degToRad(camera.fov);
              const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * Math.max(camera.aspect, 0.35));
              const tanHorizontal = Math.tan(horizontalFov / 2);
              const tanVertical = Math.tan(verticalFov / 2);
              const worldUp = new THREE.Vector3(0, 1, 0);
              const cameraForward = viewDirection.clone().negate();
              const cameraRight = new THREE.Vector3().crossVectors(cameraForward, worldUp).normalize();
              const cameraUp = new THREE.Vector3().crossVectors(cameraRight, cameraForward).normalize();
              let requiredDistance = maxDimension * 0.55;
              for (const corner of fitCorners) {
                const alongView = corner.dot(viewDirection);
                const horizontal = Math.abs(corner.dot(cameraRight));
                const vertical = Math.abs(corner.dot(cameraUp));
                requiredDistance = Math.max(
                  requiredDistance,
                  alongView + horizontal / tanHorizontal,
                  alongView + vertical / tanVertical
                );
              }
              // A small breathing margin keeps mirrors and bumpers away from the canvas edge.
              return requiredDistance * 0.94;
            };
            getResponsiveFitDistance = getFitDistance;
            fittedDistance = getFitDistance();
            camera.position.copy(viewDirection.clone().multiplyScalar(fittedDistance));
            camera.near = Math.max(maxDimension / 1000, 0.001);
            camera.far = Math.max(maxDimension * 100, fittedDistance * 20);
            camera.lookAt(0, 0, 0);
            camera.updateProjectionMatrix();
            controls.target.set(0, 0, 0);
            controls.minDistance = maxDimension * 0.28;
            controls.maxDistance = maxDimension * 8;
            controls.update();
            resetView = () => {
              camera.position.copy(viewDirection.clone().multiplyScalar(fittedDistance));
              controls.target.set(0, 0, 0);
              controls.update();
            };
            resetViewRef.current = resetView;
            setModelReady(true);
            setStatus(`${modelName} loaded · drag to rotate · scroll to zoom`);
          },
          (error) => {
            console.error(`Unable to parse local ${modelName} GLB:`, error);
            if (!disposed) {
              setFailed(true);
              setStatus(`3D model parse failed: ${error?.message || "unsupported or invalid GLB data"}`);
            }
          }
        );

        let getResponsiveFitDistance = () => fittedDistance;
        const resize = () => {
          if (!hostRef.current || !renderer) return;
          const width = Math.max(host.clientWidth, 1);
          const height = Math.max(host.clientHeight, 1);
          const previousFit = fittedDistance;
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          if (modelRoot && previousFit > 0) {
            const nextFit = getResponsiveFitDistance();
            const currentDistance = camera.position.distanceTo(controls?.target || new THREE.Vector3());
            const zoomRatio = currentDistance / previousFit;
            fittedDistance = nextFit;
            camera.position.copy(viewDirection.clone().multiplyScalar(nextFit * zoomRatio));
            controls?.update();
          }
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
        console.error(`Unable to initialize the ${modelName} viewer:`, error);
        if (!disposed) {
          setFailed(true);
          setStatus(error?.message || "3D viewer initialization failed in this browser.");
        }
      }
    }

    start();
    return () => {
      disposed = true;
      modelRequest.abort();
      motionQuery?.removeEventListener?.("change", syncMotionPreference);
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      controls?.dispose();
      resetViewRef.current = null;
      controlsRef.current = null;
      if (modelRoot) {
        const geometries = new Set();
        const materials = new Set();
        const textures = new Set();
        modelRoot.traverse((object) => {
          if (object.geometry) geometries.add(object.geometry);
          const objectMaterials = Array.isArray(object.material)
            ? object.material
            : object.material ? [object.material] : [];
          objectMaterials.forEach((material) => {
            materials.add(material);
            Object.values(material).forEach((value) => {
              if (value?.isTexture) textures.add(value);
            });
          });
        });
        geometries.forEach((geometry) => geometry.dispose());
        textures.forEach((texture) => texture.dispose());
        materials.forEach((material) => material.dispose());
      }
      if (renderer) {
        renderer.dispose();
        renderer.domElement.remove();
      }
    };
  }, [modelPath, modelName]);

  return (
    <div className="ford-glb-viewer">
      <div ref={hostRef} className="ford-glb-stage" style={{ width: "100%", height: "min(76vh, 820px)", minHeight: "620px", position: "relative", overflow: "hidden" }} />
      <div className="ford-glb-controls" style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"10px",padding:"10px 12px",background:"#202126",color:"#f7f5f3"}}>
        <div className="ford-glb-status" role="status" style={{fontSize:"11px",lineHeight:1.5,flex:"1 1 180px",minWidth:0}}>{status}</div>
        <div style={{display:"flex",gap:"8px",flex:"0 1 auto",flexWrap:"wrap"}}><button type="button" onClick={() => { const next = !autoRotate; setAutoRotate(next); if (controlsRef.current) controlsRef.current.autoRotate = next; }} disabled={!modelReady || prefersReducedMotion} aria-pressed={autoRotate} aria-label={autoRotate?"Pause automatic model rotation":"Start automatic model rotation"} title={prefersReducedMotion?"Automatic rotation is disabled by your reduced-motion setting":undefined} style={{border:"1px solid #ffffff66",background:autoRotate?"#f7f5f3":"transparent",color:autoRotate?"#202126":"inherit",padding:"8px 12px",fontSize:"10px",fontWeight:700,cursor:modelReady&&!prefersReducedMotion?"pointer":"not-allowed",opacity:modelReady&&!prefersReducedMotion?1:0.5}}>{autoRotate?"Pause rotation":"Auto rotate"}</button><button type="button" onClick={() => resetViewRef.current?.()} disabled={!modelReady} aria-label="Reset the 3D model camera view" style={{border:"1px solid #ffffff66",background:"transparent",color:"inherit",padding:"8px 12px",fontSize:"10px",fontWeight:700,cursor:modelReady?"pointer":"not-allowed",opacity:modelReady?1:0.5}}>Reset view</button></div>
      </div>
      {failed && <p className="ford-glb-help">Check your internet connection and reload the page. The 3D asset is served from this project, not an external 360° service.</p>}
    </div>
  );
}
