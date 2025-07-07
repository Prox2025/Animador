import bpy

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def create_footer():
    # Criar plano grande para o rodapé
    bpy.ops.mesh.primitive_plane_add(size=2, location=(0, 0, 0))
    footer = bpy.context.active_object

    # Reduzir escala vertical para ser uma faixa fina
    footer.scale[1] = 0.2  # altura fina
    footer.scale[0] = 5.0  # largura maior

    # Material com gradient para rodapé tipo CSS linear-gradient
    mat = bpy.data.materials.new(name="FooterMaterial")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links

    # Limpar nós padrão
    for node in nodes:
        nodes.remove(node)

    # Criar nós necessários
    output_node = nodes.new(type='ShaderNodeOutputMaterial')
    shader_mix = nodes.new(type='ShaderNodeMixShader')
    transp_shader = nodes.new(type='ShaderNodeBsdfTransparent')
    diffuse_shader = nodes.new(type='ShaderNodeBsdfDiffuse')
    gradient_tex = nodes.new(type='ShaderNodeTexGradient')
    mapping = nodes.new(type='ShaderNodeMapping')
    tex_coord = nodes.new(type='ShaderNodeTexCoord')
    color_ramp = nodes.new(type='ShaderNodeValToRGB')

    # Configurar gradient vertical (linear to top)
    mapping.vector_type = 'POINT'
    mapping.rotation[2] = 1.5708  # rotacionar 90 graus para vertical (z)
    
    # Configurar ramp para imitar seu CSS
    color_ramp.color_ramp.elements.new(0.25)
    color_ramp.color_ramp.elements.new(0.50)
    color_ramp.color_ramp.elements.new(0.85)
    color_ramp.color_ramp.elements.new(1.0)

    # Ajustar cores do ramp (simulando seu CSS)
    # Elementos podem não estar em ordem, vamos definir 5 stops manualmente
    elems = color_ramp.color_ramp.elements
    elems[0].position = 0.0
    elems[0].color = (0, 0, 0, 1.0)        # rgba(0,0,0,1)
    elems[1].position = 0.25
    elems[1].color = (0, 0, 0, 0.7)        # rgba(0,0,0,0.7)
    elems[2].position = 0.50
    elems[2].color = (0, 0, 0, 0.4)        # rgba(0,0,0,0.4)
    elems[3].position = 0.85
    elems[3].color = (0, 0, 0, 0.1)        # rgba(0,0,0,0.1)
    elems[4].position = 1.0
    elems[4].color = (0, 0, 0, 0.0)        # rgba(0,0,0,0)

    # Conectar nodes
    links.new(tex_coord.outputs['Object'], mapping.inputs['Vector'])
    links.new(mapping.outputs['Vector'], gradient_tex.inputs['Vector'])
    links.new(gradient_tex.outputs['Fac'], color_ramp.inputs['Fac'])
    links.new(color_ramp.outputs['Color'], diffuse_shader.inputs['Color'])

    links.new(transp_shader.outputs['BSDF'], shader_mix.inputs[1])
    links.new(diffuse_shader.outputs['BSDF'], shader_mix.inputs[2])
    links.new(color_ramp.outputs['Alpha'], shader_mix.inputs['Fac'])

    links.new(shader_mix.outputs['Shader'], output_node.inputs['Surface'])

    # Configurar material para transparência
    mat.blend_method = 'BLEND'
    mat.shadow_method = 'NONE'

    # Aplicar material ao plano
    footer.data.materials.append(mat)

def setup_render():
    scene = bpy.context.scene

    # Usar EEVEE para render rápido com transparência
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.film_transparent = True

    # Render configurações
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'

    scene.render.resolution_x = 1280
    scene.render.resolution_y = 200  # altura só do rodapé
    scene.render.resolution_percentage = 100

    scene.frame_start = 1
    scene.frame_end = 1

    scene.render.filepath = "//rodape_transparente.png"

    # Criar câmera para enquadrar o plano do rodapé
    cam_data = bpy.data.cameras.new("Camera")
    cam = bpy.data.objects.new("Camera", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam

    # Posicionar câmera olhando para o plano de frente
    cam.location = (0, -2, 0)
    cam.rotation_euler = (1.5708, 0, 0)  # 90 graus em X para olhar de frente (Z para Y)

def main():
    clear_scene()
    create_footer()
    setup_render()
    bpy.ops.render.render(write_still=True)

if __name__ == "__main__":
    main()
