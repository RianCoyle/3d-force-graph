import * as THREE from 'https://esm.sh/three'; // ERROR: Multiple instances of Three.js being imported; also in example/custom-node-geometry
import { GLTFLoader } from 'https://esm.sh/three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const cachedModels = {};

const spriteTable = {
    'company': {
        'sprite': 'sprites/Large Building.glb',
        'scale': 5,
        'rotationY': Math.PI,
    },
    'investment': {
        'sprite': 'sprites/Cash Stack.glb',
        'scale': 8,
        'rotationX': Math.PI/6,
    },
    'phone-call': {
        'sprite': 'sprites/Phone.glb',
        'scale': 0.1,
        'rotationY': Math.PI*3/2,
    },
    'article': {
        'sprite': 'sprites/Article.glb',
        'scale': 55,
        'rotationY': Math.PI/2,
        'rotationX': Math.PI/6,
    }
}

const nodeTypes = ['node', ...Object.keys(spriteTable)];

const N = 50;

// TODO: Fix load times with large number of nodes: less resolution? 

const nodes = [...Array(N).keys()]
    .map(i => ({
        id: i,
        type: nodeTypes[Math.floor(Math.random() * nodeTypes.length)],
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
    .nodeLabel(node => `Id: ${node.id}, Degree: ${node.degree}, Type: ${node.type}`)
    .linkLabel('label')
    .linkWidth(1.2)
    .linkCurvature(0.2)
    .linkColor('color')
    .linkOpacity(0.4)
    .backgroundColor('#0a0e2b');
    // .onNodeDragEnd(node => {
    //     node.fx = node.x;
    //     node.fy = node.y;
    //     node.fz = node.z;
    // });;

// FIX: onNodeDragEnd fix position and then unfix for later moves

Graph.nodeThreeObject(node => {

    // Custom imported geometry
    if (node.type in spriteTable) {
        console.log('found');

        // Async load
        if (cachedModels[node.id]) {
            return cachedModels[node.id].clone();
        }

        for (const [type, loadData] of Object.entries(spriteTable)) {
            if (node.type != type) continue

            loader.load(loadData.sprite, gltf => {
                const model = gltf.scene;
                const scale = loadData.scale * 1.1 + (loadData.scale * node.degree * 0.6); // Geometry load scale + modified effect of node degree
                const rotation = new THREE.Euler(
                    loadData.rotationX ?? 0, 
                    loadData.rotationY ?? 0, 
                    loadData.rotationZ ?? 0
                );

                model.traverse((child) => {
                    if (child.isMesh) {
                        child.rotation.copy(rotation);
                        child.scale.setScalar(scale);
                    }
                });

                cachedModels[node.id] = model;
                Graph.refresh();
            })
            break;
        }
    }

    // Node geometry
    const material = new THREE.MeshBasicMaterial({ color: node.color || '' }); // flat color
    const geometry = new THREE.SphereGeometry(4 + (node.degree * 1.5) || 4, 16, 16);
    return new THREE.Mesh(geometry, material);
});

// TODO: Select a node and have that be the pivot of orbit
// TODO: View controls
// FIX: Dragging custom geometry objects