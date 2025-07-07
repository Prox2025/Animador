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

    elements = color_ramp.color_ramp.elements

    points = [
        (0.0, 1.0),
        (0.25, 0.7),
        (0.5, 0.4),
        (0.85, 0.1),
        (1.0, 0.0),
    ]

    elements[0].position = points[0][0]
    elements[0].color = (0, 0, 0, points[0][1])

    for i in range(len(elements) - 1, 0, -1):
        elements.remove(elements[i])

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

    rodape.location.y = -12
    rodape.keyframe_insert(data_path="location", frame=1)
    rodape.location.y = -9.5
    rodape.keyframe_insert(data_path="location", frame=30)
    rodape.keyframe_insert(data_path="location", frame=150)
    rodape.location.y = -12
    rodape.keyframe_insert(data_path="location", frame=180)
    rodape.keyframe_insert(data_path="location", frame=300)

    for fcurve in rodape.animation_data.action.fcurves:
        for kp in fcurve.keyframe_points:
            kp.interpolation = 'LINEAR'

def create_camera():
    bpy.ops.object.camera_add(location=(0, 0, 10))
    cam = bpy.context.active_object
    cam.rotation_euler = (1.5708, 0, 0)
    bpy.context.scene.camera = cam

def configure_render():
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.use_denoising = False  # ← ESSENCIAL para evitar erro em CI
    scene.render.film_transparent = True

    output_path = os.path.join(os.getcwd(), "rodape_animado.webm")
    scene.render.filepath = output_path

    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format = 'WEBM'
    scene.render.ffmpeg.codec = 'WEBM'
    scene.render.ffmpeg.constant_rate_factor = 'HIGH'
    scene.render.ffmpeg.video_bitrate = 1000
    scene.render.image_settings.color_mode = 'RGBA'
    scene.frame_start = 1
    scene.frame_end = 300  # 10 segundos a 30 fps
    scene.render.fps = 30
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720

# Execução principal
clear_scene()
create_footer()
create_camera()
configure_render()
bpy.ops.render.render(animation=True)
