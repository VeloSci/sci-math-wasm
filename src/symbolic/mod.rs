use wasm_bindgen::prelude::*;
use std::collections::HashMap;

#[derive(Debug, Clone)]
pub enum Expr {
    Number(f64),
    Variable(String),
    Add(Box<Expr>, Box<Expr>),
    Sub(Box<Expr>, Box<Expr>),
    Mul(Box<Expr>, Box<Expr>),
    Div(Box<Expr>, Box<Expr>),
    Pow(Box<Expr>, Box<Expr>),
    Sin(Box<Expr>),
    Cos(Box<Expr>),
    Exp(Box<Expr>),
    Ln(Box<Expr>),
}

impl Expr {
    pub fn simplify(&self) -> Expr {
        match self {
            Expr::Add(l, r) => {
                let sl = l.simplify();
                let sr = r.simplify();
                match (sl, sr) {
                    (Expr::Number(0.0), e) => e,
                    (e, Expr::Number(0.0)) => e,
                    (Expr::Number(a), Expr::Number(b)) => Expr::Number(a + b),
                    (l, r) => Expr::Add(Box::new(l), Box::new(r)),
                }
            }
            Expr::Mul(l, r) => {
                let sl = l.simplify();
                let sr = r.simplify();
                match (sl, sr) {
                    (Expr::Number(0.0), _) => Expr::Number(0.0),
                    (_, Expr::Number(0.0)) => Expr::Number(0.0),
                    (Expr::Number(1.0), e) => e,
                    (e, Expr::Number(1.0)) => e,
                    (Expr::Number(a), Expr::Number(b)) => Expr::Number(a * b),
                    (l, r) => Expr::Mul(Box::new(l), Box::new(r)),
                }
            }
            _ => self.clone(),
        }
    }

    pub fn diff(&self, var: &str) -> Expr {
        match self {
            Expr::Number(_) => Expr::Number(0.0),
            Expr::Variable(v) => if v == var { Expr::Number(1.0) } else { Expr::Number(0.0) },
            Expr::Add(l, r) => Expr::Add(Box::new(l.diff(var)), Box::new(r.diff(var))),
            Expr::Sub(l, r) => Expr::Sub(Box::new(l.diff(var)), Box::new(r.diff(var))),
            Expr::Mul(l, r) => Expr::Add(
                Box::new(Expr::Mul(Box::new(l.diff(var)), r.clone())),
                Box::new(Expr::Mul(l.clone(), Box::new(r.diff(var))))
            ),
            Expr::Div(l, r) => Expr::Div(
                Box::new(Expr::Sub(
                    Box::new(Expr::Mul(Box::new(l.diff(var)), r.clone())),
                    Box::new(Expr::Mul(l.clone(), Box::new(r.diff(var))))
                )),
                Box::new(Expr::Pow(r.clone(), Box::new(Expr::Number(2.0))))
            ),
            Expr::Pow(l, r) => {
                match r.as_ref() {
                    Expr::Number(n) => Expr::Mul(
                        Box::new(Expr::Mul(Box::new(Expr::Number(*n)), Box::new(Expr::Pow(l.clone(), Box::new(Expr::Number(n - 1.0)))))),
                        Box::new(l.diff(var))
                    ),
                    _ => Expr::Number(0.0),
                }
            }
            Expr::Sin(e) => Expr::Mul(Box::new(Expr::Cos(e.clone())), Box::new(e.diff(var))),
            Expr::Cos(e) => Expr::Mul(Box::new(Expr::Number(-1.0)), Box::new(Expr::Mul(Box::new(Expr::Sin(e.clone())), Box::new(e.diff(var))))),
            Expr::Exp(e) => Expr::Mul(Box::new(Expr::Exp(e.clone())), Box::new(e.diff(var))),
            Expr::Ln(e) => Expr::Div(Box::new(e.diff(var)), e.clone()),
        }
    }

    pub fn integrate(&self, var: &str) -> Expr {
        match self {
            Expr::Number(n) => Expr::Mul(Box::new(Expr::Number(*n)), Box::new(Expr::Variable(var.to_string()))),
            Expr::Variable(v) => if v == var { 
                Expr::Mul(Box::new(Expr::Number(0.5)), Box::new(Expr::Pow(Box::new(Expr::Variable(v.clone())), Box::new(Expr::Number(2.0)))))
            } else {
                Expr::Mul(self.clone().into(), Box::new(Expr::Variable(var.to_string())))
            },
            Expr::Add(l, r) => Expr::Add(Box::new(l.integrate(var)), Box::new(r.integrate(var))),
            Expr::Sub(l, r) => Expr::Sub(Box::new(l.integrate(var)), Box::new(r.integrate(var))),
            _ => Expr::Number(0.0),
        }
    }

    pub fn eval(&self, vars: &HashMap<String, f64>) -> f64 {
        match self {
            Expr::Number(n) => *n,
            Expr::Variable(v) => *vars.get(v).unwrap_or(&0.0),
            Expr::Add(l, r) => l.eval(vars) + r.eval(vars),
            Expr::Sub(l, r) => l.eval(vars) - r.eval(vars),
            Expr::Mul(l, r) => l.eval(vars) * r.eval(vars),
            Expr::Div(l, r) => l.eval(vars) / r.eval(vars),
            Expr::Pow(l, r) => l.eval(vars).powf(r.eval(vars)),
            Expr::Sin(e) => e.eval(vars).sin(),
            Expr::Cos(e) => e.eval(vars).cos(),
            Expr::Exp(e) => e.eval(vars).exp(),
            Expr::Ln(e) => e.eval(vars).ln(),
        }
    }

    pub fn to_latex_internal(&self) -> String {
        match self {
            Expr::Number(n) => n.to_string(),
            Expr::Variable(v) => v.clone(),
            Expr::Add(l, r) => format!("({} + {})", l.to_latex_internal(), r.to_latex_internal()),
            Expr::Sub(l, r) => format!("({} - {})", l.to_latex_internal(), r.to_latex_internal()),
            Expr::Mul(l, r) => format!("{} \\cdot {}", l.to_latex_internal(), r.to_latex_internal()),
            Expr::Div(l, r) => format!("\\frac{{{}}}{{{}}}", l.to_latex_internal(), r.to_latex_internal()),
            Expr::Pow(l, r) => format!("{{{}}}^{{{}}}", l.to_latex_internal(), r.to_latex_internal()),
            Expr::Sin(e) => format!("\\sin({})", e.to_latex_internal()),
            Expr::Cos(e) => format!("\\cos({})", e.to_latex_internal()),
            Expr::Exp(e) => format!("e^{{{}}}", e.to_latex_internal()),
            Expr::Ln(e) => format!("\\ln({})", e.to_latex_internal()),
        }
    }

    pub fn to_string_internal(&self) -> String {
        match self {
            Expr::Number(n) => n.to_string(),
            Expr::Variable(v) => v.clone(),
            Expr::Add(l, r) => format!("({}+{})", l.to_string_internal(), r.to_string_internal()),
            Expr::Sub(l, r) => format!("({}-{})", l.to_string_internal(), r.to_string_internal()),
            Expr::Mul(l, r) => format!("({}*{})", l.to_string_internal(), r.to_string_internal()),
            Expr::Div(l, r) => format!("({}/{})", l.to_string_internal(), r.to_string_internal()),
            Expr::Pow(l, r) => format!("({}^{})", l.to_string_internal(), r.to_string_internal()),
            Expr::Sin(e) => format!("sin({})", e.to_string_internal()),
            Expr::Cos(e) => format!("cos({})", e.to_string_internal()),
            Expr::Exp(e) => format!("exp({})", e.to_string_internal()),
            Expr::Ln(e) => format!("ln({})", e.to_string_internal()),
        }
    }
}

#[wasm_bindgen]
pub struct SymbolicExpr {
    inner: Expr,
}

#[wasm_bindgen]
impl SymbolicExpr {
    #[allow(unused_variables)]
    #[wasm_bindgen(static_method_of = SymbolicExpr)]
    pub fn parse(s: &str) -> Result<SymbolicExpr, JsValue> {
        if s == "x" { return Ok(SymbolicExpr { inner: Expr::Variable("x".into()) }); }
        if s == "y" { return Ok(SymbolicExpr { inner: Expr::Variable("y".into()) }); }
        if let Ok(n) = s.parse::<f64>() { return Ok(SymbolicExpr { inner: Expr::Number(n) }); }
        Err(JsValue::from_str("Unsupported simple expression. Use 'x', 'y' or a number."))
    }

    pub fn simplify(&self) -> SymbolicExpr {
        SymbolicExpr { inner: self.inner.simplify() }
    }

    pub fn diff(&self, var: &str) -> SymbolicExpr {
        SymbolicExpr { inner: self.inner.diff(var) }
    }

    pub fn integrate(&self, var: &str) -> SymbolicExpr {
        SymbolicExpr { inner: self.inner.integrate(var) }
    }

    pub fn eval(&self, var_name: &str, val: f64) -> f64 {
        let mut vars = HashMap::new();
        vars.insert(var_name.to_string(), val);
        self.inner.eval(&vars)
    }

    pub fn compile(&self, var_name: &str) -> js_sys::Function {
        let expr_str = self.inner.to_string_internal();
        // Simple replacement of ^ with ** for JS
        let js_expr = expr_str.replace("^", "**");
        js_sys::Function::new_with_args(var_name, &format!("return {};", js_expr))
    }

    pub fn to_latex(&self) -> String {
        self.inner.to_latex_internal()
    }

    pub fn to_js_string(&self) -> String {
        self.inner.to_string_internal()
    }
}
