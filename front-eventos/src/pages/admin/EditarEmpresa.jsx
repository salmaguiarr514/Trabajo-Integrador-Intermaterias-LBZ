import { useParams } from "react-router-dom";
import EmpresaForm from "./EmpresaForm.jsx";

// key distinta por id: al cambiar de empresa (o pasar a "nueva") el formulario arranca de cero
function EditarEmpresa() {
  const { id } = useParams();
  return <EmpresaForm key={id} />;
}

export default EditarEmpresa;
