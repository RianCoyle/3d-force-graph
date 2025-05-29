import * as THREE from 'https://esm.sh/three';
import { GLTFLoader } from 'https://esm.sh/three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const cachedModels = {};

// loader.load('sprites/model.glb', gltf => {
//     scene.add(gltf.scene);
// });

const N = 50;

const nodes = [...Array(N).keys()]
    .map(i => ({
        id: i,
        type: 'Node',
        color:'rgb(40, 238, 145)' //#27E7D7
    }));

const links = [...Array(N).keys()]
    .filter(id => id)
    .map(id => {
        const target = Math.round(Math.random() * (id-1));
        return {
            source: id,
            target,
            label: `Connects ${id} to ${target}`,
            color: '#FFE232'
        };
    });

// Compute degree for each node
const nodeDegreeMap = {};
links.forEach(({ source, target }) => {
  nodeDegreeMap[source] = (nodeDegreeMap[source] || 0) + 1;
  nodeDegreeMap[target] = (nodeDegreeMap[target] || 0) + 1;
});

nodes.forEach(node => {
  node.degree = nodeDegreeMap[node.id] || 1; // default to 1 if isolated
});

const gData = {
    nodes,
    links
};

const Graph = new ForceGraph3D(document.querySelector('#force-graph'), {controlType: 'orbit'})
    .graphData(gData)
    .nodeLabel(node => `Degree: ${node.degree}, Type: ${node.type}`)
    .linkLabel('label')
    .linkWidth(1.5)
    .linkCurvature(0.2)
    .linkColor('color')
    .linkOpacity(0.9)
    .backgroundColor('#0a0e2b');

nodes.slice(1, 5).forEach(node => {
    node.type = 'company';
});

Graph.nodeThreeObject(node => {
    if (node.type == 'company') {
        if (cachedModels[node.id]) {
            const obj = cachedModels[node.id].clone();
            const scale = 3 * node.degree;
            obj.scale.set(scale, scale, scale)
            return obj;
        }

        loader.load('sprites/Large Building.glb', gltf => {
            cachedModels[node.id] = gltf.scene;
            Graph.refresh();
        })
    }

    console.log('Hello?');
    const material = new THREE.MeshBasicMaterial({ color: node.color }); // flat color
    const geometry = new THREE.SphereGeometry(2 + (node.degree * 2) || 4, 16, 16);
    return new THREE.Mesh(geometry, material);
})
    .nodeThreeObjectExtend(false); // replace default, not extend