// polytope-viewer.js
// three.js によるポリトープ描画

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import { affineRankBasis, convexHull2D, padTo3D } from './polytope-data.js';

const COLORS = {
    background: 0xf4f6f8,
    face: 0x2878b8,
    edge: 0x1a3a5c,
    vertex: 0xd84a2a,
    ray: 0xe8920a,
};

export class PolytopeViewer {
    constructor(container) {
        this.container = container;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(COLORS.background);

        const w = container.clientWidth || 600;
        const h = container.clientHeight || 480;
        this.camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 1000);
        this.camera.position.set(3, 2.5, 4);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(w, h);
        container.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;

        this.scene.add(new THREE.HemisphereLight(0xffffff, 0x667788, 1.2));
        const dir = new THREE.DirectionalLight(0xffffff, 1.5);
        dir.position.set(5, 8, 6);
        this.scene.add(dir);

        this.objects = new THREE.Group();
        this.scene.add(this.objects);

        window.addEventListener('resize', () => this.resize());

        const animate = () => {
            this.animationId = requestAnimationFrame(animate);
            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        };
        animate();
    }

    resize() {
        const w = this.container.clientWidth || 600;
        const h = this.container.clientHeight || 480;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }

    clear() {
        this.objects.traverse(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                (Array.isArray(obj.material) ? obj.material : [obj.material])
                    .forEach(m => m.dispose());
            }
        });
        this.objects.clear();
    }

    /**
     * ポリトープを描画する。
     * @param {{vertices: number[][], rays: number[][]}} model
     *   vertices / rays は次元 1〜3 の座標ベクトルの配列
     */
    render(model) {
        this.clear();

        const pts = model.vertices.map(padTo3D);
        const rays = (model.rays || []).map(padTo3D);
        if (pts.length === 0) return;

        const v3 = pts.map(p => new THREE.Vector3(...p));

        // バウンディング情報（カメラフィットとサイズ基準に使用）
        const box = new THREE.Box3().setFromPoints(v3);
        const center = box.getCenter(new THREE.Vector3());
        const radius = Math.max(box.getSize(new THREE.Vector3()).length() / 2, 1);

        const { rank, origin, basis } = affineRankBasis(pts);

        if (rank >= 3) {
            this.addSolid(v3);
        } else if (rank === 2) {
            this.addPolygon(pts, origin, basis);
        } else if (rank === 1) {
            this.addSegment(pts, origin, basis[0]);
        }

        this.addVertexMarkers(v3, radius);
        this.addRays(rays, center, radius);

        this.objects.add(new THREE.AxesHelper(radius * 1.6));

        this.fitCamera(center, radius);
    }

    addSolid(v3) {
        const geometry = new ConvexGeometry(v3);
        const material = new THREE.MeshLambertMaterial({
            color: COLORS.face,
            transparent: true,
            opacity: 0.45,
            side: THREE.DoubleSide,
        });
        this.objects.add(new THREE.Mesh(geometry, material));

        const edges = new THREE.EdgesGeometry(geometry, 1);
        this.objects.add(new THREE.LineSegments(
            edges, new THREE.LineBasicMaterial({ color: COLORS.edge })));
    }

    addPolygon(pts, origin, basis) {
        // 平面基底に射影して 2D 凸包をとり、もとの 3D 空間で多角形を描く
        const proj = pts.map(p => basis.map(b =>
            b.reduce((s, bi, i) => s + bi * (p[i] - origin[i]), 0)));
        const hull = convexHull2D(proj);
        if (hull.length < 3) return;

        const ring = hull.map(i => new THREE.Vector3(...pts[i]));

        const positions = [];
        for (let k = 1; k < ring.length - 1; k++) {
            positions.push(ring[0], ring[k], ring[k + 1]); // 凸なので扇形分割でよい
        }
        const geometry = new THREE.BufferGeometry().setFromPoints(positions);
        geometry.computeVertexNormals();
        const material = new THREE.MeshLambertMaterial({
            color: COLORS.face,
            transparent: true,
            opacity: 0.45,
            side: THREE.DoubleSide,
        });
        this.objects.add(new THREE.Mesh(geometry, material));

        const loop = new THREE.BufferGeometry().setFromPoints(ring);
        this.objects.add(new THREE.LineLoop(
            loop, new THREE.LineBasicMaterial({ color: COLORS.edge })));
    }

    addSegment(pts, origin, dir) {
        let tMin = Infinity, tMax = -Infinity, pMin = pts[0], pMax = pts[0];
        for (const p of pts) {
            const t = dir.reduce((s, di, i) => s + di * (p[i] - origin[i]), 0);
            if (t < tMin) { tMin = t; pMin = p; }
            if (t > tMax) { tMax = t; pMax = p; }
        }
        const geometry = new THREE.BufferGeometry().setFromPoints(
            [new THREE.Vector3(...pMin), new THREE.Vector3(...pMax)]);
        this.objects.add(new THREE.Line(
            geometry, new THREE.LineBasicMaterial({ color: COLORS.edge })));
    }

    addVertexMarkers(v3, radius) {
        const r = radius * 0.02;
        const geometry = new THREE.SphereGeometry(r, 16, 12);
        const material = new THREE.MeshLambertMaterial({ color: COLORS.vertex });
        for (const p of v3) {
            const m = new THREE.Mesh(geometry, material);
            m.position.copy(p);
            this.objects.add(m);
        }
    }

    addRays(rays, center, radius) {
        const len = radius * 1.5;
        for (const r of rays) {
            const dir = new THREE.Vector3(...r);
            if (dir.lengthSq() === 0) continue;
            dir.normalize();
            this.objects.add(new THREE.ArrowHelper(
                dir, center, len, COLORS.ray, len * 0.12, len * 0.06));
        }
    }

    fitCamera(center, radius) {
        const dist = radius / Math.tan((this.camera.fov / 2) * Math.PI / 180) * 1.4;
        const dirVec = new THREE.Vector3(1, 0.8, 1.2).normalize();
        this.camera.position.copy(center).addScaledVector(dirVec, dist);
        this.camera.near = dist / 100;
        this.camera.far = dist * 100;
        this.camera.updateProjectionMatrix();
        this.controls.target.copy(center);
        this.controls.update();
    }

    dispose() {
        cancelAnimationFrame(this.animationId);
        this.clear();
        this.renderer.dispose();
        this.renderer.domElement.remove();
    }
}
