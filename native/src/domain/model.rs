use serde::{Deserialize, Serialize};

pub use crate::domain::transform::{ParsedClass, SubComponent};

/// Entity: representasi komponen hasil parsing/transformasi.
#[derive(Serialize, Deserialize)]
pub struct ComponentDefinition {
    pub name: String,
    pub tag: String,
    pub classes: Vec<ClassName>,
    pub sub_components: Vec<SubComponent>,
}

/// Value object: class atomik immutable.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ClassName(pub String);

/// Value object: rantai variant immutable (mis. md:hover).
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct VariantChain(pub Vec<String>);

/// Value object: deklarasi CSS immutable.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct CssDeclaration {
    pub property: String,
    pub value: String,
}

/// Aggregate root untuk operasi transform komponen.
#[derive(Serialize, Deserialize)]
pub struct Component {
    pub definition: ComponentDefinition,
}

/// Aggregate root untuk hasil scanning workspace.
#[derive(Serialize, Deserialize)]
pub struct ScanResult {
    pub files: Vec<crate::application::scanner::ScannedFile>,
    pub unique_classes: Vec<ClassName>,
    pub total_files: u32,
}

/// Aggregate root untuk bundle CSS terkompilasi.
#[derive(Serialize, Deserialize)]
pub struct CssBundle {
    pub css: String,
    pub classes: Vec<ClassName>,
    pub size_bytes: u32,
}
