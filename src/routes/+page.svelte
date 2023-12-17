<script lang="ts">
    import * as THREE from 'three';
    import { GLTFLoader, type GLTF } from 'three-stdlib';
    import { onMount } from 'svelte';
    import * as SC from 'svelte-cubed';

    let model: GLTF | null = null;

    onMount(async () => {
        const loader = new GLTFLoader();
        model = await loader.loadAsync('/vtuber_neuro-sama.glb');
    });
</script>

<style>
    body {
        filter: grayscale(100%);
    }
</style>

<SC.Canvas antialias background={new THREE.Color('grey')}>
    {#if model}
        <SC.Primitive object={model.scene} />
    {/if}
    <SC.PerspectiveCamera position={[1, 1, 3]} />
    <SC.OrbitControls />
</SC.Canvas>