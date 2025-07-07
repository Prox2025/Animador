import bpy
import os

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def create_footer():
    bpy.ops.mesh.primitive_plane_add(size=20, location=(0, -9.5, 0.01))
    rodape = bpy.context.active_object
    rodape.scale[1] = 0.1

    mat = bpy.data.materials.new(name="FooterGradient")
    mat.use_nodes = True
    mat.blend_method = 'BLEND'
    mat.shadow_method = 'NONE'
    mat.use_backface_culling = False
    mat.show_transparent_back = False

    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    output = nodes.new("ShaderNodeOutputMaterial")
    transp = nodes.new("ShaderNodeBsdfTransparent")
    emission = nodes.new("ShaderNodeEmission")
    mix = nodes.new("ShaderNodeMixShader")
    gradient = nodes.new("ShaderNodeTexGradient")
    mapping = nodes.new("ShaderNodeMapping")
    texcoord = nodes.new("ShaderNodeTexCoord")
    color_ramp = nodes.new("ShaderNodeValToRGB")

    gradient.gradient_type = 'LINEAR'
    mapping.vector_type = 'POINT'
    mapping.inputs['Rotation'].default_value[0] = 1.5708  # 90° em X

    # Limpar color ramp sem erro
    elements = color_ramp.color_ramp.elements

    # Resetar primeiro elemento (sempre existe)
    points = [
        (0.0, 1.0),   # opacidade 1
        (0.25, 0.7),
        (0.5, 0.4),
        (0.85, 0.1),
        (1.0, 0.0),
    ]

    elements[0].position = points[0][0]
    elements[0].color = (0, 0, 0, points[0][1])

    # Remove os demais elementos (se houver)
    for i in range(len(elements) - 1, 0, -1):
        elements.remove(elements[i])

    # Adiciona os outros pontos do gradiente
    for pos, alpha in points[1:]:
        elem = elements.new(pos)
        elem.color = (0, 0, 0, alpha)

    links.new(texcoord.outputs['Object'], mapping.inputs['Vector'])
    links.new(mapping.outputs['Vector'], gradient.inputs['Vector'])
    links.new(gradient.outputs['Fac'], color_ramp.inputs['Fac'])
    links.new(color_ramp.outputs['Color'], emission.inputs['Color'])
    links.new(transp.outputs['BSDF'], mix.inputs[1])
    links.new(emission.outputs['Emission'], mix.inputs[2])
    links.new(mix.outputs['Shader'], output.inputs['Surface'])
    links.new(color_ramp.outputs['Alpha'], mix.inputs['Fac'])

    rodape.data.materials.append(mat)

    # Animação
    rodape.location.y = -12
    rodape.keyframe_insert(data_path="location", frame=1)     # 0%
    rodape.location.y = -9.5
    rodape.keyframe_insert(data_path="location", frame=30)    # 10%
    rodape.keyframe_insert(data_path="location", frame=150)   # 50%
    rodape.location.y = -12
    rodape.keyframe_insert(data_path="location", frame=180)   # 60%
    rodape.keyframe_insert(data_path="location", frame=300)   # 100%

    # Interpolação linear para suavizar movimento
    for fcurve in rodape.animation_data.action.fcurves:
        for kp in fcurve.keyframe_points:
            kp.interpolation = 'LINEAR'

def configure_render():
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.film_transparent = True

    output_path = os.path.join(os.getcwd(), "rodape_animado.webm")
    scene.render.filepath = output_path

    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format = 'WEBM'
    scene.render.ffmpeg.codec = 'WEBM_VP9'
    scene.render.ffmpeg.constant_rate_factor = 'HIGH'
    scene.render.ffmpeg.video_bitrate = 1000
    scene.render.image_settings.color_mode = 'RGBA'
    scene.frame_start = 1
    scene.frame_end = 300  # 10 segundos a 30fps
    scene.render.fps = 30
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720

# Execução principal
clear_scene()
create_footer()
configure_render()
bpy.ops.render.render(animation=True)
