// シーン、カメラ、レンダラーの設定
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 400; // カメラを遠くに配置して多くの星が見えるように

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// パーティクルジオメトリの設定
let geometry = new THREE.BufferGeometry();

// SETTINGSオブジェクトの設定
const SETTINGS = {
    radius: 100,    // 立方体、球体、および楕円体の基本半径
    amount: 10000   // 星の数
};

// 状態を保持する変数
let transitioningTo = 'sphere'; // 最初は球体への変化から開始

// 星の位置を更新する関数（立方体内にランダムに配置）
function initializeStars(radius, amount) {
    radius = radius || SETTINGS.radius;
    amount = amount || SETTINGS.amount;

    const diameter = radius * 2;
    const vertices = [];
    const cubeTargets = [];
    const sphereTargets = [];
    const ellipsoidTargets = [];

    for (let i = 0; i < amount; i++) {
        // 立方体内のランダムな位置
        const x = (Math.random() * diameter) - radius;
        const y = (Math.random() * diameter) - radius;
        const z = (Math.random() * diameter) - radius;
        vertices.push(x, y, z);
        cubeTargets.push(x, y, z);

        // 球体の表面上の目標位置を計算
        const theta = Math.random() * Math.PI * 2; // ランダムな角度
        const phi = Math.acos((Math.random() * 2) - 1); // ランダムな傾き
        const r = radius;

        const sphericalX = r * Math.sin(phi) * Math.cos(theta);
        const sphericalY = r * Math.sin(phi) * Math.sin(theta);
        const sphericalZ = r * Math.cos(phi);
        sphereTargets.push(sphericalX, sphericalY, sphericalZ);

        // 楕円体の表面上の目標位置を計算
        const scaleX = 1.0; // x方向のスケール（そのまま）
        const scaleY = 0.5; // y方向のスケール（縮める）
        const scaleZ = 1.5; // z方向のスケール（伸ばす）

        const ellipsoidX = r * Math.sin(phi) * Math.cos(theta) * scaleX;
        const ellipsoidY = r * Math.sin(phi) * Math.sin(theta) * scaleY;
        const ellipsoidZ = r * Math.cos(phi) * scaleZ;
        ellipsoidTargets.push(ellipsoidX, ellipsoidY, ellipsoidZ);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('cubeTargetPosition', new THREE.Float32BufferAttribute(cubeTargets, 3));
    geometry.setAttribute('sphereTargetPosition', new THREE.Float32BufferAttribute(sphereTargets, 3));
    geometry.setAttribute('ellipsoidTargetPosition', new THREE.Float32BufferAttribute(ellipsoidTargets, 3));
}

// 初回は立方体の位置を生成
initializeStars(SETTINGS.radius, SETTINGS.amount);

// シンプルなマテリアルを使用
const material = new THREE.PointsMaterial({
    color: 0x99ccff,
    size: 1.0,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
});

// パーティクルメッシュを作成しシーンに追加
const stars = new THREE.Points(geometry, material);
scene.add(stars);

// アニメーションループ
function animate() {
    requestAnimationFrame(animate);

    // 頂点位置の更新
    const positions = geometry.attributes.position.array;
    const cubeTargets = geometry.attributes.cubeTargetPosition.array;
    const sphereTargets = geometry.attributes.sphereTargetPosition.array;
    const ellipsoidTargets = geometry.attributes.ellipsoidTargetPosition.array;

    // 目標の位置にゆっくりと移動する
    for (let i = 0; i < positions.length; i++) {
        if (transitioningTo === 'sphere') {
            positions[i] += (sphereTargets[i] - positions[i]) * 0.01; // 球体の目標位置に近づける
        } else if (transitioningTo === 'ellipsoid') {
            positions[i] += (ellipsoidTargets[i] - positions[i]) * 0.01; // 楕円体の目標位置に近づける
        } else if (transitioningTo === 'cube') {
            positions[i] += (cubeTargets[i] - positions[i]) * 0.01; // 立方体の目標位置に近づける
        }
    }

    geometry.attributes.position.needsUpdate = true; // ジオメトリの更新をThree.jsに知らせる

    // 変化が完了したら次の形状へ
    if (transitioningTo === 'sphere' && checkIfTransitionComplete(positions, sphereTargets)) {
        transitioningTo = 'ellipsoid'; // 球体への変化が完了したら次は楕円体へ
    } else if (transitioningTo === 'ellipsoid' && checkIfTransitionComplete(positions, ellipsoidTargets)) {
        transitioningTo = 'cube'; // 楕円体への変化が完了したら次は立方体へ
    } else if (transitioningTo === 'cube' && checkIfTransitionComplete(positions, cubeTargets)) {
        transitioningTo = 'sphere'; // 立方体への変化が完了したら次は球体へ
    }

    // 星をゆっくり回転させる
    stars.rotation.y += 0.005;
    stars.rotation.x += 0.001;

    renderer.render(scene, camera);
}

// すべての頂点が目標位置に近いかどうかをチェックする関数
function checkIfTransitionComplete(currentPositions, targetPositions) {
    const threshold = 0.1; // 許容する誤差の範囲
    for (let i = 0; i < currentPositions.length; i++) {
        if (Math.abs(currentPositions[i] - targetPositions[i]) > threshold) {
            return false; // どれかが目標位置に十分近くないならまだ変化中
        }
    }
    return true; // 全ての頂点が目標位置に十分近い
}

animate();

// ウィンドウサイズ変更に対応
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
