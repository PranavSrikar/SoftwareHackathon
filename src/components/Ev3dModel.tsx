import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { 
  RotateCw, 
  Sparkles, 
  Zap, 
  Eye, 
  Palette, 
  Sun, 
  Maximize2, 
  BatteryCharging, 
  Gauge,
  Layers,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

interface Ev3dModelProps {
  modelName: string;
  isCharging: boolean;
  batterySoc: number;
  chargingRateKw: number;
}

// Available High-End Automotive Metallic Paint Presets
const PAINT_PRESETS = [
  { id: 'red', name: 'Cyber Red Metallic', body: 0xb91c1c, accent: 0x0f172a, caliper: 0xd90429, metalness: 0.88, roughness: 0.12 },
  { id: 'blue', name: 'Liquid Titanium Blue', body: 0x0284c7, accent: 0x0b1329, caliper: 0x06b6d4, metalness: 0.92, roughness: 0.14 },
  { id: 'white', name: 'Pearl White Multi-Coat', body: 0xf8fafc, accent: 0x1e293b, caliper: 0xef4444, metalness: 0.5, roughness: 0.15 },
  { id: 'stealth', name: 'Stealth Satin Black', body: 0x18181b, accent: 0x09090b, caliper: 0xeab308, metalness: 0.7, roughness: 0.28 },
  { id: 'green', name: 'Mamba Green Metallic', body: 0x059669, accent: 0x064e3b, caliper: 0x10b981, metalness: 0.85, roughness: 0.14 },
  { id: 'amber', name: 'Solar Amber Gold', body: 0xd97706, accent: 0x451a03, caliper: 0xf59e0b, metalness: 0.9, roughness: 0.13 },
];

export const Ev3dModel: React.FC<Ev3dModelProps> = ({
  modelName,
  isCharging,
  batterySoc,
  chargingRateKw,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [headlightsOn, setHeadlightsOn] = useState(true);
  const [activeCameraAngle, setActiveCameraAngle] = useState<'PERSPECTIVE' | 'FRONT' | 'SIDE' | 'TOP' | 'REAR' | 'INTERIOR'>('PERSPECTIVE');
  
  // Find default color based on model name
  const defaultPaint = useMemo(() => {
    const lower = modelName.toLowerCase();
    if (lower.includes('tesla')) return PAINT_PRESETS[0]; // Red
    if (lower.includes('ioniq') || lower.includes('hyundai')) return PAINT_PRESETS[1]; // Blue
    if (lower.includes('taycan') || lower.includes('porsche')) return PAINT_PRESETS[4]; // Green
    if (lower.includes('lightning') || lower.includes('ford')) return PAINT_PRESETS[5]; // Amber
    if (lower.includes('leaf') || lower.includes('nissan')) return PAINT_PRESETS[1]; // Blue
    if (lower.includes('bmw') || lower.includes('i4')) return PAINT_PRESETS[3]; // Stealth
    return PAINT_PRESETS[1];
  }, [modelName]);

  const [selectedPaint, setSelectedPaint] = useState(defaultPaint);

  // Update selected paint if model changes
  useEffect(() => {
    setSelectedPaint(defaultPaint);
  }, [defaultPaint]);

  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const carGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 380;
    const height = container.clientHeight || 280;

    // 1. Scene setup
    const scene = new THREE.Scene();

    // 2. Camera setup with cinematic 45-degree angle
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(4.6, 2.2, 4.8);
    camera.lookAt(0, 0.45, 0);
    cameraRef.current = camera;

    // 3. High Performance Renderer with Photorealistic ACES Filmic Tone Mapping
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Studio Automotive Lighting (High-End Showroom Configuration)
    // A. Soft Ambient Base
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    // B. Overhead Linear Studio Softbox (creates the signature continuous commercial highlight streak)
    const overheadSoftbox = new THREE.DirectionalLight(0xffffff, 1.8);
    overheadSoftbox.position.set(0, 8.5, 0.5);
    overheadSoftbox.castShadow = true;
    overheadSoftbox.shadow.mapSize.width = 2048;
    overheadSoftbox.shadow.mapSize.height = 2048;
    overheadSoftbox.shadow.camera.near = 0.5;
    overheadSoftbox.shadow.camera.far = 20;
    overheadSoftbox.shadow.bias = -0.0008;
    scene.add(overheadSoftbox);

    // C. Key 3/4 Front Light (highlights front bumper, wheels, and grille)
    const keyLight = new THREE.DirectionalLight(0xfef08a, 1.2);
    keyLight.position.set(5.5, 4.0, 4.5);
    scene.add(keyLight);

    // D. Rim / Silhouette Backlight (produces the crisp cyan/ice-blue contour on rear haunches)
    const rimLight = new THREE.DirectionalLight(0x7dd3fc, 1.5);
    rimLight.position.set(-6.5, 3.5, -4.5);
    scene.add(rimLight);

    // E. Left Fill Light
    const fillLight = new THREE.DirectionalLight(0xe2e8f0, 0.8);
    fillLight.position.set(-4.5, 2.5, 4.5);
    scene.add(fillLight);

    // F. Dynamic Charger Point Light
    const chargerColor = isCharging ? 0x06b6d4 : 0x10b981;
    const chargerPointLight = new THREE.PointLight(chargerColor, isCharging ? 3.5 : 1.0, 7);
    chargerPointLight.position.set(-2.2, 1.1, 1.4);
    scene.add(chargerPointLight);

    // 5. High-Fidelity Multi-Layer PBR Materials
    // Multi-Coat Metallic Clearcoat Car Paint
    const carPaintMat = new THREE.MeshPhysicalMaterial({
      color: selectedPaint.body,
      metalness: selectedPaint.metalness,
      roughness: selectedPaint.roughness,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      reflectivity: 1.0,
    });

    // Dark Gloss Carbon / Piano Black Aero Trim
    const glossBlackAeroMat = new THREE.MeshStandardMaterial({
      color: selectedPaint.accent,
      metalness: 0.8,
      roughness: 0.15,
    });

    // Matte Carbon Diffuser
    const matteAeroMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.4,
      roughness: 0.5,
    });

    // Tinted Automotive Safety Glass (Realistic Deep Smoky Glass with Interior Visibility)
    const autoGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x050b14,
      metalness: 0.9,
      roughness: 0.02,
      transmission: 0.65,
      transparent: true,
      opacity: 0.88,
      ior: 1.55,
      reflectivity: 0.95,
    });

    // Polished Billet Aluminium & Chrome
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.98,
      roughness: 0.08,
    });

    // Machined Two-Tone Alloy Rims
    const alloyFaceMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.92,
      roughness: 0.12,
    });

    const alloyPocketMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.25,
    });

    // High-Performance Carbon-Ceramic Brake Rotor
    const brakeRotorMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.9,
      roughness: 0.25,
    });

    // Painted Brembo-style Multi-Piston Brake Caliper
    const caliperMat = new THREE.MeshStandardMaterial({
      color: selectedPaint.caliper,
      metalness: 0.4,
      roughness: 0.25,
    });

    // Vulcanized Molded Tire Rubber
    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x141416,
      roughness: 0.88,
      metalness: 0.05,
    });

    // Optical LED Projector & Taillights
    const ledHeadlightMat = new THREE.MeshBasicMaterial({ 
      color: headlightsOn ? 0xf0f9ff : 0x64748b 
    });
    const drlGlowMat = new THREE.MeshBasicMaterial({ 
      color: headlightsOn ? 0x38bdf8 : 0x334155 
    });
    const taillightRubyMat = new THREE.MeshBasicMaterial({ 
      color: 0xff002b 
    });

    // Interior Luxury Cockpit Materials
    const leatherMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.85 });
    const dashTrimMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35, metalness: 0.6 });
    const screenUiMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });

    // 6. Build High-Poly Aerodynamic 3D Sports Coupe / Sedan
    const carGroup = new THREE.Group();
    carGroupRef.current = carGroup;

    // === A. MAIN AERODYNAMIC MONOCOQUE BODY ===
    // 1. Lower Fuselage
    const mainBodyGeo = new THREE.BoxGeometry(3.35, 0.46, 1.5);
    const mainBodyMesh = new THREE.Mesh(mainBodyGeo, carPaintMat);
    mainBodyMesh.position.set(0, 0.54, 0);
    mainBodyMesh.castShadow = true;
    mainBodyMesh.receiveShadow = true;
    carGroup.add(mainBodyMesh);

    // 2. Sculpted Sloping Hood with Dynamic Center Spine
    const hoodGeo = new THREE.CylinderGeometry(0.74, 0.76, 0.92, 24, 1, false, 0, Math.PI);
    const hoodMesh = new THREE.Mesh(hoodGeo, carPaintMat);
    hoodMesh.rotation.set(0, 0, Math.PI / 2);
    hoodMesh.position.set(1.18, 0.68, 0);
    hoodMesh.scale.set(0.32, 1.44, 0.98);
    hoodMesh.castShadow = true;
    carGroup.add(hoodMesh);

    // 3. Muscular Flared Front Wheel Arches (Fenders)
    const frontFenderGeo = new THREE.BoxGeometry(0.72, 0.42, 0.1);
    const frontFenderR = new THREE.Mesh(frontFenderGeo, carPaintMat);
    frontFenderR.position.set(0.98, 0.56, 0.77);
    const frontFenderL = new THREE.Mesh(frontFenderGeo, carPaintMat);
    frontFenderL.position.set(0.98, 0.56, -0.77);
    carGroup.add(frontFenderR, frontFenderL);

    // 4. Muscular Flared Rear Shoulder Haunches
    const rearHaunchR = new THREE.Mesh(frontFenderGeo, carPaintMat);
    rearHaunchR.position.set(-0.98, 0.57, 0.77);
    const rearHaunchL = new THREE.Mesh(frontFenderGeo, carPaintMat);
    rearHaunchL.position.set(-0.98, 0.57, -0.77);
    carGroup.add(rearHaunchR, rearHaunchL);

    // 5. Scalloped Side Body Door Inset (Aerodynamic Air Channels)
    const doorIndentGeo = new THREE.BoxGeometry(1.2, 0.28, 0.04);
    const doorIndentR = new THREE.Mesh(doorIndentGeo, glossBlackAeroMat);
    doorIndentR.position.set(0, 0.52, 0.76);
    const doorIndentL = new THREE.Mesh(doorIndentGeo, glossBlackAeroMat);
    doorIndentL.position.set(0, 0.52, -0.76);
    carGroup.add(doorIndentR, doorIndentL);

    // 6. Front Carbon Bumper Fascia & Ground Aero Splitter
    const frontSplitterGeo = new THREE.BoxGeometry(0.42, 0.1, 1.48);
    const frontSplitter = new THREE.Mesh(frontSplitterGeo, glossBlackAeroMat);
    frontSplitter.position.set(1.64, 0.35, 0);
    carGroup.add(frontSplitter);

    // Front EV Aerodynamic Nose Intake Grille
    const frontNoseGeo = new THREE.BoxGeometry(0.08, 0.22, 1.0);
    const frontNose = new THREE.Mesh(frontNoseGeo, glossBlackAeroMat);
    frontNose.position.set(1.69, 0.46, 0);
    carGroup.add(frontNose);

    // Side Air Curtains (channels air around front wheels)
    const airCurtainR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.14), glossBlackAeroMat);
    airCurtainR.position.set(1.64, 0.46, 0.65);
    const airCurtainL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.14), glossBlackAeroMat);
    airCurtainL.position.set(1.64, 0.46, -0.65);
    carGroup.add(airCurtainR, airCurtainL);

    // 7. Aerodynamic Ground Effect Side Skirts
    const skirtGeo = new THREE.BoxGeometry(1.65, 0.1, 0.08);
    const skirtR = new THREE.Mesh(skirtGeo, glossBlackAeroMat);
    skirtR.position.set(0, 0.33, 0.77);
    const skirtL = new THREE.Mesh(skirtGeo, glossBlackAeroMat);
    skirtL.position.set(0, 0.33, -0.77);
    carGroup.add(skirtR, skirtL);

    // 8. Rear Carbon Diffuser with Vertical Aero Fins
    const rearDiffuserGeo = new THREE.BoxGeometry(0.42, 0.2, 1.44);
    const rearDiffuser = new THREE.Mesh(rearDiffuserGeo, matteAeroMat);
    rearDiffuser.position.set(-1.64, 0.39, 0);
    carGroup.add(rearDiffuser);

    // 3 Vertical Aerodynamic Diffuser Fins
    for (let finIdx = -1; finIdx <= 1; finIdx++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.03), glossBlackAeroMat);
      fin.position.set(-1.64, 0.33, finIdx * 0.38);
      carGroup.add(fin);
    }

    // Rear Integrated Lip Spoiler / Ducktail
    const spoilerGeo = new THREE.BoxGeometry(0.24, 0.08, 1.36);
    const spoiler = new THREE.Mesh(spoilerGeo, glossBlackAeroMat);
    spoiler.position.set(-1.64, 0.8, 0);
    carGroup.add(spoiler);

    // === B. FASTBACK CANOPY & PANORAMIC GLASS GREENHOUSE ===
    // 1. Panoramic Center Glass Dome
    const roofCanopyGeo = new THREE.BoxGeometry(1.8, 0.5, 1.2);
    const roofCanopy = new THREE.Mesh(roofCanopyGeo, autoGlassMat);
    roofCanopy.position.set(-0.1, 1.02, 0);
    roofCanopy.castShadow = true;
    carGroup.add(roofCanopy);

    // 2. Raked Aerodynamic Windshield
    const windshieldGeo = new THREE.CylinderGeometry(0.56, 0.74, 1.18, 8);
    const windshield = new THREE.Mesh(windshieldGeo, autoGlassMat);
    windshield.rotation.z = Math.PI / 4.3;
    windshield.position.set(0.74, 0.88, 0);
    carGroup.add(windshield);

    // 3. Fastback Sloping Rear Glass Window
    const rearWindowGeo = new THREE.CylinderGeometry(0.55, 0.74, 1.18, 8);
    const rearWindow = new THREE.Mesh(rearWindowGeo, autoGlassMat);
    rearWindow.rotation.z = -Math.PI / 4.1;
    rearWindow.position.set(-0.94, 0.89, 0);
    carGroup.add(rearWindow);

    // 4. Gloss Black Painted Roof Pillars (A, B, C Pillars)
    const aPillarR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.62, 0.08), glossBlackAeroMat);
    aPillarR.position.set(0.68, 0.95, 0.58);
    aPillarR.rotation.z = -Math.PI / 5.5;
    const aPillarL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.62, 0.08), glossBlackAeroMat);
    aPillarL.position.set(0.68, 0.95, -0.58);
    aPillarL.rotation.z = -Math.PI / 5.5;

    const cPillarR = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.62, 0.1), glossBlackAeroMat);
    cPillarR.position.set(-0.88, 0.96, 0.58);
    cPillarR.rotation.z = Math.PI / 5.2;
    const cPillarL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.62, 0.1), glossBlackAeroMat);
    cPillarL.position.set(-0.88, 0.96, -0.58);
    cPillarL.rotation.z = Math.PI / 5.2;

    const roofRailR = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.06, 0.08), carPaintMat);
    roofRailR.position.set(-0.1, 1.28, 0.59);
    const roofRailL = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.06, 0.08), carPaintMat);
    roofRailL.position.set(-0.1, 1.28, -0.59);

    carGroup.add(aPillarR, aPillarL, cPillarR, cPillarL, roofRailR, roofRailL);

    // === C. DETAILED LUXURY COCKPIT INTERIOR (Visible through glass) ===
    const cockpitGroup = new THREE.Group();

    // Sculpted Ergonomic Sports Bucket Seats (Front & Rear)
    const createSeat = (x: number, z: number, isDriver: boolean) => {
      const seat = new THREE.Group();
      // Seat base cushion
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.42), leatherMat);
      base.position.set(0, 0.72, 0);
      // Seat back with side bolsters
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.46, 0.4), leatherMat);
      back.position.set(-0.15, 0.96, 0);
      back.rotation.z = Math.PI / 20;
      // Headrest
      const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 0.24), leatherMat);
      headrest.position.set(-0.18, 1.23, 0);

      seat.add(base, back, headrest);
      seat.position.set(x, 0, z);
      return seat;
    };

    cockpitGroup.add(createSeat(0.12, 0.28, true));
    cockpitGroup.add(createSeat(0.12, -0.28, false));
    cockpitGroup.add(createSeat(-0.62, 0.28, false));
    cockpitGroup.add(createSeat(-0.62, -0.28, false));

    // Modern Curved Dashboard
    const dashGeo = new THREE.BoxGeometry(0.36, 0.18, 1.14);
    const dashMesh = new THREE.Mesh(dashGeo, dashTrimMat);
    dashMesh.position.set(0.46, 0.86, 0);
    cockpitGroup.add(dashMesh);

    // 15-inch Floating Ultra-HD Center Console Display
    const centerDisplayGeo = new THREE.BoxGeometry(0.04, 0.2, 0.32);
    const centerDisplay = new THREE.Mesh(centerDisplayGeo, screenUiMat);
    centerDisplay.position.set(0.44, 0.96, 0);
    centerDisplay.rotation.y = -0.15;
    cockpitGroup.add(centerDisplay);

    // Ergonomic D-Cut Sports Steering Wheel / Yoke
    const steeringWheel = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.022, 12, 24), leatherMat);
    steeringWheel.position.set(0.36, 0.95, 0.28);
    steeringWheel.rotation.y = Math.PI / 2;
    cockpitGroup.add(steeringWheel);

    // Center Console Armrest & Cup Holder Unit
    const armrest = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.2, 0.22), leatherMat);
    armrest.position.set(0, 0.74, 0);
    cockpitGroup.add(armrest);

    carGroup.add(cockpitGroup);

    // === D. ADVANCED LIGHTING OPTICS & DETAILS ===
    // 1. Dual Multi-Element LED Matrix Headlights
    const hlHousingGeo = new THREE.BoxGeometry(0.16, 0.09, 0.3);
    const hlHousingR = new THREE.Mesh(hlHousingGeo, ledHeadlightMat);
    hlHousingR.position.set(1.66, 0.63, 0.5);
    const hlDrlR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.03, 0.34), drlGlowMat);
    hlDrlR.position.set(1.66, 0.68, 0.5);

    const hlHousingL = new THREE.Mesh(hlHousingGeo, ledHeadlightMat);
    hlHousingL.position.set(1.66, 0.63, -0.5);
    const hlDrlL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.03, 0.34), drlGlowMat);
    hlDrlL.position.set(1.66, 0.68, -0.5);

    carGroup.add(hlHousingR, hlDrlR, hlHousingL, hlDrlL);

    // Headlight Light Cones onto Ground (when headlights are ON)
    if (headlightsOn) {
      const spotLightR = new THREE.SpotLight(0xf0fdf4, 3.5, 9, Math.PI / 6, 0.4);
      spotLightR.position.set(1.7, 0.65, 0.5);
      spotLightR.target.position.set(6, 0, 0.5);
      scene.add(spotLightR);
      scene.add(spotLightR.target);

      const spotLightL = new THREE.SpotLight(0xf0fdf4, 3.5, 9, Math.PI / 6, 0.4);
      spotLightL.position.set(1.7, 0.65, -0.5);
      spotLightL.target.position.set(6, 0, -0.5);
      scene.add(spotLightL);
      scene.add(spotLightL.target);
    }

    // 2. Full-Width Seamless OLED Rear Lightbar
    const rearLightbarGeo = new THREE.BoxGeometry(0.08, 0.07, 1.36);
    const rearLightbar = new THREE.Mesh(rearLightbarGeo, taillightRubyMat);
    rearLightbar.position.set(-1.66, 0.71, 0);
    carGroup.add(rearLightbar);

    // 3. Aerodynamic Wing Mirrors with Integrated Turn Repeaters
    const createMirror = (isRight: boolean) => {
      const mirror = new THREE.Group();
      const shell = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.09, 0.18), carPaintMat);
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.08), chromeMat);
      glass.position.set(-0.09, 0, 0);
      glass.rotation.y = -Math.PI / 2;
      const indicator = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.02, 0.02), drlGlowMat);
      indicator.position.set(0.09, 0, 0);
      mirror.add(shell, glass, indicator);
      mirror.position.set(0.58, 0.94, isRight ? 0.76 : -0.76);
      return mirror;
    };
    carGroup.add(createMirror(true), createMirror(false));

    // 4. Flush Pop-Out Aerodynamic Door Handles
    const createHandle = (x: number, z: number) => {
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.02), chromeMat);
      handle.position.set(x, 0.64, z);
      return handle;
    };
    carGroup.add(createHandle(0.24, 0.76), createHandle(-0.48, 0.76));
    carGroup.add(createHandle(0.24, -0.76), createHandle(-0.48, -0.76));

    // === E. ULTRA-REALISTIC WHEEL & TIRE ASSEMBLIES ===
    const createRealisticWheelAssembly = (x: number, z: number, isRight: boolean) => {
      const wheel = new THREE.Group();

      // 1. Tire Rubber with Beveled Shoulder
      const tireGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.24, 32);
      const tireMesh = new THREE.Mesh(tireGeo, tireMat);
      tireMesh.rotation.x = Math.PI / 2;
      tireMesh.castShadow = true;
      tireMesh.receiveShadow = true;
      wheel.add(tireMesh);

      // 2. Deep Concave Rim Barrel
      const barrelGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.25, 24);
      const barrel = new THREE.Mesh(barrelGeo, alloyPocketMat);
      barrel.rotation.x = Math.PI / 2;
      wheel.add(barrel);

      // 3. 5-Twin-Spoke Machined Turbine Alloy Face
      const spokeCount = 5;
      for (let i = 0; i < spokeCount; i++) {
        const angle = (i * Math.PI * 2) / spokeCount;
        // Main blade
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.24, 0.03), alloyFaceMat);
        spoke.position.set(Math.cos(angle) * 0.12, Math.sin(angle) * 0.12, isRight ? 0.12 : -0.12);
        spoke.rotation.z = angle + 0.3; // Aero directional sweep
        wheel.add(spoke);

        // Secondary counter blade (Twin spoke)
        const subSpoke = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.03), alloyFaceMat);
        subSpoke.position.set(Math.cos(angle + 0.18) * 0.11, Math.sin(angle + 0.18) * 0.11, isRight ? 0.12 : -0.12);
        subSpoke.rotation.z = angle + 0.45;
        wheel.add(subSpoke);
      }

      // 4. Center Hub Cap with Chrome Trim
      const centerCap = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.26, 20), chromeMat);
      centerCap.rotation.x = Math.PI / 2;
      wheel.add(centerCap);

      // 5 Lug Nuts
      for (let lug = 0; lug < 5; lug++) {
        const lugAngle = (lug * Math.PI * 2) / 5;
        const lugNut = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.27, 8), chromeMat);
        lugNut.rotation.x = Math.PI / 2;
        lugNut.position.set(Math.cos(lugAngle) * 0.04, Math.sin(lugAngle) * 0.04, 0);
        wheel.add(lugNut);
      }

      // 5. Cross-Drilled Ventilated Steel Brake Rotor
      const rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 28), brakeRotorMat);
      rotor.rotation.x = Math.PI / 2;
      rotor.position.z = isRight ? 0.04 : -0.04;
      wheel.add(rotor);

      // 6. 6-Piston Performance Brake Caliper
      const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.14, 0.07), caliperMat);
      caliper.position.set(0.1, 0.1, isRight ? 0.05 : -0.05);
      wheel.add(caliper);

      wheel.position.set(x, 0.34, z);
      return wheel;
    };

    // Mount 4 Wheels
    carGroup.add(createRealisticWheelAssembly(0.98, 0.74, true));
    carGroup.add(createRealisticWheelAssembly(0.98, -0.74, false));
    carGroup.add(createRealisticWheelAssembly(-0.98, 0.74, true));
    carGroup.add(createRealisticWheelAssembly(-0.98, -0.74, false));

    // Under-Chassis Neon Glow Plane (Smooth breathing pulse when charging)
    const underglowGeo = new THREE.PlaneGeometry(3.0, 1.4);
    const underglowMat = new THREE.MeshBasicMaterial({
      color: isCharging ? 0x06b6d4 : 0x10b981,
      transparent: true,
      opacity: isCharging ? 0.55 : 0.2,
      side: THREE.DoubleSide,
    });
    const underglow = new THREE.Mesh(underglowGeo, underglowMat);
    underglow.rotation.x = Math.PI / 2;
    underglow.position.y = 0.08;
    carGroup.add(underglow);

    // === F. CHARGING STATION PEDESTAL & ANIMATED POWER CABLE ===
    if (isCharging) {
      // Charge Port Door Flap & Illuminated Halo Ring
      const portDoor = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.11, 0.03), glossBlackAeroMat);
      portDoor.position.set(-1.26, 0.65, 0.77);
      const portRing = new THREE.Mesh(new THREE.RingGeometry(0.035, 0.055, 24), new THREE.MeshBasicMaterial({ color: 0x06b6d4, side: THREE.DoubleSide }));
      portRing.position.set(-1.26, 0.65, 0.79);
      carGroup.add(portDoor, portRing);

      // Flexible Charging Cable
      const cableCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.26, 0.65, 0.79),
        new THREE.Vector3(-1.75, 0.38, 1.15),
        new THREE.Vector3(-2.15, 0.1, 1.4),
        new THREE.Vector3(-2.4, 0.9, 1.35),
      ]);
      const cableGeo = new THREE.TubeGeometry(cableCurve, 32, 0.038, 12, false);
      const cableMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.3, metalness: 0.4 });
      const cableMesh = new THREE.Mesh(cableGeo, cableMat);
      carGroup.add(cableMesh);

      // Commercial Fast Charger Pedestal Unit
      const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.6, 0.32), new THREE.MeshStandardMaterial({ color: 0x0a0f1d, metalness: 0.7, roughness: 0.2 }));
      pedestal.position.set(-2.4, 0.8, 1.35);
      pedestal.castShadow = true;

      const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.26), new THREE.MeshBasicMaterial({ color: 0x0284c7 }));
      screen.position.set(-2.3, 1.2, 1.35);
      screen.rotation.y = -Math.PI / 4;

      const beacon = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.09, 0.34), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
      beacon.position.set(-2.4, 1.58, 1.35);

      carGroup.add(pedestal, screen, beacon);
    }

    // === G. HIGH-END SHOWROOM TURNTABLE PLATFORM ===
    // Realistic Contact AO Floor Shadow
    const shadowGeo = new THREE.PlaneGeometry(3.6, 1.8);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.65,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.01;
    scene.add(shadowPlane);

    // Turntable Base Stage
    const turntableGeo = new THREE.CylinderGeometry(2.8, 2.8, 0.12, 64);
    const turntableMat = new THREE.MeshStandardMaterial({
      color: 0x070c16,
      roughness: 0.85,
      metalness: 0.3,
    });
    const turntable = new THREE.Mesh(turntableGeo, turntableMat);
    turntable.position.y = -0.06;
    turntable.receiveShadow = true;
    scene.add(turntable);

    // Glowing Concentric Precision Guide Rings
    const ringGeo = new THREE.RingGeometry(2.72, 2.78, 80);
    const ringMat = new THREE.MeshBasicMaterial({
      color: isCharging ? 0x06b6d4 : 0x10b981,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.015;
    scene.add(ring);

    scene.add(carGroup);

    // 7. Interactive Drag to Orbit & Zoom
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      carGroup.rotation.y += deltaX * 0.01;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - previousMousePosition.x;
      carGroup.rotation.y += deltaX * 0.012;
      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onTouchEnd = () => {
      isDragging = false;
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domEl.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // 8. Animation Render Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth auto turntable rotation
      if (autoRotate && !isDragging) {
        carGroup.rotation.y += 0.006;
      }

      // Dynamic breathing underglow pulse
      if (isCharging) {
        const pulse = 0.5 + Math.sin(elapsed * 3.5) * 0.35;
        underglowMat.opacity = pulse;
        chargerPointLight.intensity = 2.0 + pulse * 1.8;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        const newHeight = entry.contentRect.height;
        if (newWidth > 0 && newHeight > 0) {
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      domEl.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domEl.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      domEl.removeEventListener('touchend', onTouchEnd);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [modelName, isCharging, autoRotate, selectedPaint, headlightsOn]);

  // Smooth Camera Preset Controller
  const setCameraAngle = (angle: 'PERSPECTIVE' | 'FRONT' | 'SIDE' | 'TOP' | 'REAR' | 'INTERIOR') => {
    setActiveCameraAngle(angle);
    if (!cameraRef.current) return;
    const cam = cameraRef.current;
    if (angle === 'PERSPECTIVE') {
      cam.position.set(4.6, 2.2, 4.8);
      cam.lookAt(0, 0.45, 0);
    } else if (angle === 'FRONT') {
      cam.position.set(5.4, 1.2, 0);
      cam.lookAt(0, 0.45, 0);
    } else if (angle === 'SIDE') {
      cam.position.set(0, 1.5, 5.6);
      cam.lookAt(0, 0.45, 0);
    } else if (angle === 'REAR') {
      cam.position.set(-5.4, 1.6, 0);
      cam.lookAt(0, 0.5, 0);
    } else if (angle === 'TOP') {
      cam.position.set(0.1, 6.8, 0.1);
      cam.lookAt(0, 0, 0);
    } else if (angle === 'INTERIOR') {
      cam.position.set(0.6, 1.3, 0.4);
      cam.lookAt(0, 0.85, 0);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[280px] flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900/90 to-slate-950 border border-slate-700/80 shadow-2xl">
      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left: Live Status & Specs Badges */}
      <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none flex-wrap z-10">
        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wider uppercase bg-slate-950/95 text-cyan-300 border border-cyan-500/40 shadow-xl flex items-center gap-1.5 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Realistic CAD 3D &bull; {selectedPaint.name}</span>
        </span>
        {isCharging ? (
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wider uppercase bg-emerald-950/95 text-emerald-300 border border-emerald-400/50 shadow-xl flex items-center gap-1.5 backdrop-blur-md">
            <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400 animate-bounce" />
            <span>{chargingRateKw.toFixed(1)} kW Live Flow ({Math.round(batterySoc)}% SoC)</span>
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wider uppercase bg-slate-900/95 text-slate-300 border border-slate-700 shadow-lg flex items-center gap-1.5 backdrop-blur-md">
            <span>Standby &bull; {Math.round(batterySoc)}% SoC</span>
          </span>
        )}
      </div>

      {/* Top Right: Camera Presets Toolbar */}
      <div className="absolute top-3 right-3 flex items-center gap-1 bg-slate-950/90 p-1 rounded-xl border border-slate-800 backdrop-blur-md z-10 shadow-xl">
        <button
          type="button"
          onClick={() => setCameraAngle('PERSPECTIVE')}
          className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
            activeCameraAngle === 'PERSPECTIVE' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Perspective 3/4 View"
        >
          3/4
        </button>
        <button
          type="button"
          onClick={() => setCameraAngle('FRONT')}
          className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
            activeCameraAngle === 'FRONT' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Front Fascia View"
        >
          Front
        </button>
        <button
          type="button"
          onClick={() => setCameraAngle('SIDE')}
          className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
            activeCameraAngle === 'SIDE' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Profile Side View"
        >
          Side
        </button>
        <button
          type="button"
          onClick={() => setCameraAngle('REAR')}
          className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
            activeCameraAngle === 'REAR' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Rear Haunches View"
        >
          Rear
        </button>
        <button
          type="button"
          onClick={() => setCameraAngle('TOP')}
          className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
            activeCameraAngle === 'TOP' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Top Aerodynamics View"
        >
          Top
        </button>
      </div>

      {/* Bottom Left: Interactive Paint Customizer Swatches */}
      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-slate-950/90 px-2 py-1.5 rounded-xl border border-slate-800 backdrop-blur-md z-10 shadow-xl">
        <Palette className="w-3.5 h-3.5 text-cyan-400 mr-0.5" />
        <span className="text-[10px] font-mono text-slate-400 hidden sm:inline mr-1">Paint:</span>
        {PAINT_PRESETS.map((paint) => (
          <button
            key={paint.id}
            type="button"
            onClick={() => setSelectedPaint(paint)}
            className={`w-4 h-4 rounded-full border transition-all ${
              selectedPaint.id === paint.id
                ? 'scale-125 border-cyan-400 ring-2 ring-cyan-400/50'
                : 'border-slate-600 hover:scale-110 opacity-75 hover:opacity-100'
            }`}
            style={{ backgroundColor: `#${paint.body.toString(16).padStart(6, '0')}` }}
            title={paint.name}
          />
        ))}
      </div>

      {/* Bottom Right: Studio Controls (Headlights & Turntable) */}
      <div className="absolute bottom-3 right-3 flex items-center gap-2 z-10">
        {/* Headlight Toggle */}
        <button
          type="button"
          onClick={() => setHeadlightsOn(!headlightsOn)}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border backdrop-blur-md flex items-center gap-1.5 transition-all shadow-lg ${
            headlightsOn
              ? 'bg-cyan-950/90 text-cyan-300 border-cyan-500/50 shadow-cyan-950/50'
              : 'bg-slate-900/90 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
          title="Toggle Projector Headlights"
        >
          <Sun className={`w-3.5 h-3.5 ${headlightsOn ? 'text-cyan-400 fill-cyan-400' : 'text-slate-400'}`} />
          <span className="text-[10px] font-mono">{headlightsOn ? 'LED ON' : 'LED OFF'}</span>
        </button>

        {/* 360 Turntable Toggle */}
        <button
          type="button"
          onClick={() => setAutoRotate(!autoRotate)}
          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 backdrop-blur-md flex items-center gap-1.5 transition-all shadow-lg hover:border-cyan-500/50"
          title="Toggle 360 Turntable rotation"
        >
          <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'text-cyan-400 animate-spin' : 'text-slate-400'}`} />
          <span className="text-[10px] font-mono">{autoRotate ? '360° Rotate' : 'Manual Orbit'}</span>
        </button>
      </div>
    </div>
  );
};
