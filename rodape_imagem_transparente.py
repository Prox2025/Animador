# rodape_imagem_transparente.py
import bpy

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def create_footer():
    bpy.ops.mesh.primitive_plane_add(size=20, location=(0, -9.5, 0.01))
    rodape = bpy.context.active_object
    rodape.scale[1] = 0.1

    mat = bpy.data.materials.new(name="RodapeMaterial")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links

    # Limpa nós
    for node in nodes:
        nodes.remove(node)

    # Cria nós
    output = nodes.new('ShaderNodeOutputMaterial')
    transp = nodes.new('ShaderNodeBsdfTransparent')
    diffuse = nodes.new('ShaderNodeBsdfDiffuse')
    mix = nodes.new('ShaderNodeMixShader')
    gradient = nodes.new('ShaderNodeTexGradient')
    mapping = nodes.new('ShaderNodeMapping')
    texcoord = nodes.new('ShaderNodeTexCoord')
    color_ramp = nodes.new('ShaderNodeValToRGB')

    # Configurar rotação do gradiente
    mapping.vector_type = 'POINT'
    mapping.inputs['Rotation'].default_value[2] = 1.5708  # 90 graus

    # Limpa elementos do color ramp corretamente
    while len(color_ramp.color_ramp.elements) > 0:
        color_ramp.color_ramp.elements.remove(color_ramp.color_ramp.elements[0])

    # Adiciona elementos como no CSS
    color_ramp.color_ramp.elements.new(0.0)
    color_ramp.color_ramp.elements.new(0.25)
    color_ramp.color_ramp.elements.new(0.5)
    color_ramp.color_ramp.elements.new(0.85)
    color_ramp.color_ramp.elements.new(1.0)

    elems = color_ramp.color_ramp.elements
    elems[0].position = 0.0
    elems[0].color = (0, 0, 0, 1)
    elems[1].color = (0, 0, 0, 0.7)
    elems[2].color = (0, 0, 0, 0.4)
    elems[3].color = (0, 0, 0, 0.1)
    elems[4].color = (0, 0, 0, 0.0)

    # Ligações
    links.new(texcoord.outputs['Object'], mapping.inputs['Vector'])
    links.new(mapping.outputs['Vector'], gradient.inputs['Vector'])
    links.new(gradient.outputs['Fac'], color_ramp.inputs['Fac'])
    links.new(color_ramp.outputs['Color'], mix.inputs['Fac'])
    links.new(transp.outputs['BSDF'], mix.inputs[1])
    links.new(diffuse.outputs['BSDF'], mix.inputs[2])
    links.new(mix.outputs['Shader'], output.inputs['Surface'])

    # Atribui material ao plano
    rodape.data.materials.append(mat)
    mat.blend_method = 'BLEND'
    mat.shadow_method = 'NONE'

    # Adiciona câmera
    cam = bpy.data.cameras.new("Camera")
    cam_obj = bpy.data.objects.new("Camera", cam)
    bpy.context.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj
    cam_obj.location = (0, -9.5, 1)
    cam_obj.rotation_euler = (1.5708, 0, 0)  # de cima para baixo

def configure_render():
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.film_transparent = True
    scene.render.filepath = "//rodape_transparente.png"
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.frame_start = 1
    scene.frame_end = 1
    scene.render.fps = 30
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 200

clear_scene()
create_footer()
configure_render()
bpy.ops.render.render(write_still=True)
