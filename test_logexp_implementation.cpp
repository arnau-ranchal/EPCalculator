#include <iostream>
#include <iomanip>
#include "exponents/functions.h"

using namespace std;

int main() {
    cout << fixed << setprecision(6);

    cout << "=== Testing Log-Space E_0_co Implementation ===\n\n";

    // Test 1: Baseline case (M=2, SNR=5, N=15)
    cout << "Test 1: Baseline case (M=2, SNR=5, N=15)\n";
    setN(15);
    setMod(2, "PAM");
    setSNR(5.0);
    setR(0.5);
    setQ();
    setPI();
    setW();

    double r = 0.5;
    double rho = 1.0;
    double rho_interp = 0.0;
    double E0_baseline = GD_co(r, rho, rho_interp, 100, 15, false, 0.001);

    cout << "  E0 = " << E0_baseline << endl;
    cout << "  rho = " << rho << endl;
    cout << "  r = " << r << endl;
    cout << (E0_baseline > 0 && isfinite(E0_baseline) ? "  ✓ PASS\n" : "  ✗ FAIL\n");
    cout << endl;

    // Test 2: Moderate SNR (M=4, SNR=20, N=20)
    cout << "Test 2: Moderate SNR (M=4, SNR=20, N=20)\n";
    setN(20);
    setMod(4, "PAM");
    setSNR(20.0);
    setR(0.5);
    setQ();
    setPI();
    setW();

    r = 0.5;
    rho = 1.0;
    rho_interp = 0.0;
    double E0_moderate = GD_co(r, rho, rho_interp, 100, 20, false, 0.001);

    cout << "  E0 = " << E0_moderate << endl;
    cout << "  rho = " << rho << endl;
    cout << "  r = " << r << endl;
    cout << (E0_moderate > 0 && isfinite(E0_moderate) ? "  ✓ PASS\n" : "  ✗ FAIL\n");
    cout << endl;

    // Test 3: High SNR (M=2, SNR=90, N=30) - Previously failed
    cout << "Test 3: High SNR (M=2, SNR=90, N=30) - Previously caused overflow\n";
    setN(30);
    setMod(2, "PAM");
    setSNR(90.0);
    setR(0.5);
    setQ();
    setPI();
    setW();

    r = 0.5;
    rho = 1.0;
    rho_interp = 0.0;
    double E0_high = GD_co(r, rho, rho_interp, 100, 30, false, 0.001);

    cout << "  E0 = " << E0_high << endl;
    cout << "  rho = " << rho << endl;
    cout << "  r = " << r << endl;
    cout << (E0_high > 0 && isfinite(E0_high) ? "  ✓ PASS (Overflow fixed!)\n" : "  ✗ FAIL\n");
    cout << endl;

    // Test 4: Extreme SNR (M=2, SNR=100, N=40)
    cout << "Test 4: Extreme SNR (M=2, SNR=100, N=40)\n";
    setN(40);
    setMod(2, "PAM");
    setSNR(100.0);
    setR(0.5);
    setQ();
    setPI();
    setW();

    r = 0.5;
    rho = 1.0;
    rho_interp = 0.0;
    double E0_extreme = GD_co(r, rho, rho_interp, 100, 40, false, 0.001);

    cout << "  E0 = " << E0_extreme << endl;
    cout << "  rho = " << rho << endl;
    cout << "  r = " << r << endl;
    cout << (E0_extreme > 0 && isfinite(E0_extreme) ? "  ✓ PASS (Extreme case handled!)\n" : "  ✗ FAIL\n");
    cout << endl;

    // Test 5: Very large N (M=2, SNR=50, N=99)
    cout << "Test 5: Large N (M=2, SNR=50, N=99)\n";
    setN(99);
    setMod(2, "PAM");
    setSNR(50.0);
    setR(0.5);
    setQ();
    setPI();
    setW();

    r = 0.5;
    rho = 1.0;
    rho_interp = 0.0;
    double E0_largeN = GD_co(r, rho, rho_interp, 100, 99, false, 0.001);

    cout << "  E0 = " << E0_largeN << endl;
    cout << "  rho = " << rho << endl;
    cout << "  r = " << r << endl;
    cout << (E0_largeN > 0 && isfinite(E0_largeN) ? "  ✓ PASS\n" : "  ✗ FAIL\n");
    cout << endl;

    cout << "=== All Tests Complete ===\n";

    return 0;
}
